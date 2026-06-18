use std::io::Read;
use std::path::Path;

/// 提取 EPUB 元数据
/// 返回 (title, author, cover_image_bytes)
pub fn extract_epub_metadata(path: &Path) -> Result<(String, Option<String>, Option<Vec<u8>>), String> {
    // 尝试用 epub crate
    if let Ok(result) = extract_epub_via_epub_crate(path) {
        return Ok(result);
    }

    // 回落到手动解析
    extract_epub_manual(path)
}

/// 使用 epub crate 提取元数据（epub v2 API）
fn extract_epub_via_epub_crate(path: &Path) -> Result<(String, Option<String>, Option<Vec<u8>>), String> {
    use epub::doc::EpubDoc;

    let mut doc =
        EpubDoc::new(path).map_err(|e| format!("epub crate open error: {e}"))?;

    // epub v2.1: MetadataItem { property, value, lang, refined }
    let title = doc
        .mdata("title")
        .map(|m| m.value.clone())
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string()
        });

    let author = doc
        .mdata("creator")
        .map(|m| m.value.clone());

    // epub v2 中 get_cover() 返回 Option<(Vec<u8>, String)> — (data, mime_type)
    let cover_data = doc.get_cover().map(|(data, _mime)| data);

    Ok((title, author, cover_data))
}

/// 手动解析 EPUB（通过 zip + OPF）
fn extract_epub_manual(path: &Path) -> Result<(String, Option<String>, Option<Vec<u8>>), String> {
    let file = std::fs::File::open(path)
        .map_err(|e| format!("Failed to open EPUB: {e}"))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Failed to read EPUB zip: {e}"))?;

    // 读取 META-INF/container.xml 找到 OPF 路径
    let container_xml = read_entry_as_string(&mut archive, "META-INF/container.xml")
        .map_err(|e| format!("Failed to read container.xml: {e}"))?;

    let opf_path = parse_container_xml(&container_xml)
        .ok_or_else(|| "No OPF path found in container.xml".to_string())?;

    // 读取 OPF 文件
    let opf_content = read_entry_as_string(&mut archive, &opf_path)
        .map_err(|e| format!("Failed to read OPF: {e}"))?;

    // 解析 OPF 提取标题和作者
    let (title, author) = parse_opf_metadata(&opf_content, path);

    // 尝试提取封面图片（从 OPF 中查找 cover 引用）
    let cover_data = extract_cover_from_epub(&mut archive, &opf_content, &opf_path);

    Ok((title, author, cover_data))
}

/// 从 ZIP 中读取条目为 UTF-8 字符串
fn read_entry_as_string(
    archive: &mut zip::ZipArchive<std::fs::File>,
    name: &str,
) -> Result<String, String> {
    let mut entry = archive
        .by_name(name)
        .map_err(|e| format!("Entry '{name}' not found: {e}"))?;
    let mut content = String::new();
    entry
        .read_to_string(&mut content)
        .map_err(|e| format!("Failed to read '{name}': {e}"))?;
    Ok(content)
}

/// 解析 container.xml 找到 OPF 路径
fn parse_container_xml(xml: &str) -> Option<String> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    let mut buf = Vec::new();
    let mut rootfile_path = None;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) | Ok(Event::Start(ref e)) => {
                if e.name().as_ref() == b"rootfile" {
                    if let Ok(attr) = e.try_get_attribute("full-path") {
                        if let Some(value) = attr {
                            rootfile_path = Some(
                                String::from_utf8_lossy(&value.value).to_string(),
                            );
                        }
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => {}
        }
        buf.clear();
    }

    rootfile_path
}

/// 解析 OPF 元数据
fn parse_opf_metadata(xml: &str, path: &Path) -> (String, Option<String>) {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    let mut buf = Vec::new();
    let mut title = None;
    let mut author = None;
    let mut in_metadata = false;
    let mut current_tag = String::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                if tag_name == "metadata" {
                    in_metadata = true;
                } else if in_metadata {
                    current_tag = tag_name;
                }
            }
            Ok(Event::Text(ref e)) => {
                if in_metadata && !current_tag.is_empty() {
                    let text = e.unescape().unwrap_or_default().to_string();
                    match current_tag.as_str() {
                        "title" if title.is_none() => title = Some(text),
                        "creator" | "author" if author.is_none() => author = Some(text),
                        _ => {}
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                if tag_name == "metadata" {
                    break;
                }
                current_tag.clear();
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => {}
        }
        buf.clear();
    }

    let final_title = title.unwrap_or_else(|| {
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string()
    });

    (final_title, author)
}

/// 从 EPUB 中提取封面图片
fn extract_cover_from_epub(
    archive: &mut zip::ZipArchive<std::fs::File>,
    opf_content: &str,
    opf_path: &str,
) -> Option<Vec<u8>> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    // 查找 OPF 中 cover 相关的 manifest 条目
    let mut reader = Reader::from_str(opf_content);
    let mut buf = Vec::new();
    let mut in_manifest = false;
    let mut cover_href = None;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) | Ok(Event::Empty(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                match tag_name.as_str() {
                    "manifest" => in_manifest = true,
                    "item" if in_manifest => {
                        let mut is_cover = false;
                        let mut href = None;
                        if let Ok(attr) = e.try_get_attribute("id") {
                            if let Some(val) = attr {
                                let id = String::from_utf8_lossy(&val.value).to_lowercase();
                                if id.contains("cover") {
                                    is_cover = true;
                                }
                            }
                        }
                        if let Ok(attr) = e.try_get_attribute("href") {
                            if let Some(val) = attr {
                                href = Some(String::from_utf8_lossy(&val.value).to_string());
                            }
                        }
                        if is_cover {
                            if let Some(h) = href {
                                cover_href = Some(h);
                                break;
                            }
                        }
                    }
                    _ => {}
                }
            }
            Ok(Event::End(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                if tag_name == "manifest" {
                    in_manifest = false;
                }
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => {}
        }
        buf.clear();
    }

    // 如果找到了封面引用，读取图片数据
    if let Some(href) = cover_href {
        // 计算相对于 OPF 路径的图片路径
        let opf_dir = std::path::Path::new(opf_path).parent().unwrap_or(std::path::Path::new(""));
        let cover_full_path = opf_dir.join(&href);
        let cover_path_str = cover_full_path.to_string_lossy().to_string();

        // 尝试读取图片
        if let Ok(mut entry) = archive.by_name(&cover_path_str) {
            let mut data = Vec::new();
            if entry.read_to_end(&mut data).is_ok() && !data.is_empty() {
                return Some(data);
            }
        }

        // 也尝试以路径名为键直接读取
        if let Ok(mut entry) = archive.by_name(&href) {
            let mut data = Vec::new();
            if entry.read_to_end(&mut data).is_ok() && !data.is_empty() {
                return Some(data);
            }
        }
    }

    None
}

/// 提取 PDF 元数据（lopdf 0.34 API）
pub fn extract_pdf_metadata(path: &Path) -> Result<(String, Option<String>), String> {
    use lopdf::Document;

    let doc =
        Document::load(path).map_err(|e| format!("Failed to load PDF: {e}"))?;

    // lopdf 0.34: doc.trailer 是 Dictionary（不是 Object）
    // 字典的 .get() 接受 &[u8] 参数（byte 字面量）
    let title = doc
        .trailer
        .get(b"/Info")
        .ok()
        .and_then(|info| info.as_dict().ok())
        .and_then(|info_dict| {
            info_dict
                .get(b"/Title")
                .ok()
                .and_then(|v| {
                    // lopdf 0.34: as_str() 返回 Result<&[u8], Error>
                    v.as_str().ok()
                        .map(|s| String::from_utf8_lossy(s).to_string())
                })
        })
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string()
        });

    let author = doc
        .trailer
        .get(b"/Info")
        .ok()
        .and_then(|info| info.as_dict().ok())
        .and_then(|info_dict| {
            info_dict
                .get(b"/Author")
                .ok()
                .and_then(|v| {
                    // lopdf 0.34: as_str() 返回 Result<&[u8], Error>
                    v.as_str().ok()
                        .map(|s| String::from_utf8_lossy(s).to_string())
                })
        });

    Ok((title, author))
}
