use crate::models::*;
use crate::services::{metadata, repository};
use sha1::{Digest, Sha1};
use std::fs;
use std::io::Read;
use std::path::Path;
use std::time::Instant;
use tauri::Emitter;
use tauri::AppHandle;
use tauri::Manager;
use walkdir::WalkDir;

/// 扫描目录并导入电子书
pub fn scan_directory(app_handle: AppHandle, root: &str) -> Result<ScanReport, String> {
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(format!("Directory does not exist: {root}"));
    }

    let start = Instant::now();
    let mut report = ScanReport {
        total: 0,
        added: 0,
        updated: 0,
        errors: Vec::new(),
    };

    // 收集所有电子书文件
    let mut files: Vec<std::path::PathBuf> = Vec::new();
    for entry in WalkDir::new(root_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if ext_lower == "epub" || ext_lower == "pdf" {
                    files.push(path.to_path_buf());
                }
            }
        }
    }

    report.total = files.len();
    log::info!("Found {} files to scan", files.len());

    // 逐个处理
    for (index, file_path) in files.iter().enumerate() {
        let path_str = file_path.to_string_lossy().to_string();
        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // 发送进度事件
        let _ = app_handle.emit(
            "scan-progress",
            ScanProgress {
                current: index + 1,
                total: files.len(),
                current_file: file_name.clone(),
            },
        );

        // 计算文件哈希（前 1MB SHA1）
        let file_hash = match compute_file_hash(file_path) {
            Ok(h) => Some(h),
            Err(e) => {
                log::warn!("Failed to hash {}: {}", path_str, e);
                None
            }
        };

        // 获取文件大小
        let file_size = fs::metadata(file_path).ok().map(|m| m.len() as i64);

        // 确定格式
        let format = file_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase());

        // 去重检查：是否已存在相同 hash
        let existing = if let Some(ref hash) = file_hash {
            repository::find_book_by_hash(hash).ok().flatten()
        } else {
            None
        };

        if let Some(existing_book) = existing {
            // 如果路径变了，更新路径
            if existing_book.file_path != path_str {
                if let Err(e) = repository::update_book_path(existing_book.id, &path_str) {
                    report.errors.push(format!("Failed to update path for {file_name}: {e}"));
                } else {
                    report.updated += 1;
                }
            }
            continue;
        }

        // 检查是否已存在相同路径
        if let Ok(Some(_)) = repository::find_book_by_path(&path_str) {
            continue; // 已存在，跳过
        }

        // 提取元数据
        let (mut title, author, cover_path) = match format.as_deref() {
            Some("epub") => extract_epub_metadata(&app_handle, file_path),
            Some("pdf") => extract_pdf_metadata(&app_handle, file_path),
            _ => (file_name.clone(), None, None),
        };

        // 空标题时回退到文件名
        if title.trim().is_empty() {
            title = file_name.clone();
        }

        // 插入数据库
        let book = Book {
            id: 0,
            file_path: path_str,
            file_hash,
            format,
            title,
            author,
            cover_path,
            file_size,
            added_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            rating: 0,
            is_read: 0,
            liked: Some(0),
            note_link: None,
            remark: None,
        };

        match repository::insert_book(&book) {
            Ok(_) => report.added += 1,
            Err(e) => report.errors.push(format!("Failed to insert {file_name}: {e}")),
        }
    }

    let elapsed = start.elapsed();
    log::info!(
        "Scan completed in {:.2?}: {} total, {} added, {} updated, {} errors",
        elapsed,
        report.total,
        report.added,
        report.updated,
        report.errors.len()
    );

    Ok(report)
}

/// 计算文件前 1MB 的 SHA1 哈希
fn compute_file_hash(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut hasher = Sha1::new();
    let mut buffer = [0u8; 8192]; // 8KB buffer
    let mut total_read = 0;
    let max_read: usize = 1_048_576; // 1MB

    while total_read < max_read {
        let remaining = max_read - total_read;
        let to_read = remaining.min(buffer.len());
        let bytes_read = file
            .read(&mut buffer[..to_read])
            .map_err(|e| format!("Failed to read file: {e}"))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
        total_read += bytes_read;
    }

    Ok(format!("{:x}", hasher.finalize()))
}

/// 提取 EPUB 元数据
fn extract_epub_metadata(app_handle: &AppHandle, path: &Path) -> (String, Option<String>, Option<String>) {
    match metadata::extract_epub_metadata(path) {
        Ok((title, author, cover_data)) => {
            let cover_path = if let Some(data) = cover_data {
                save_cover_image(app_handle, &title, &data)
            } else {
                None
            };
            (title, author, cover_path)
        }
        Err(e) => {
            log::warn!("Failed to extract EPUB metadata from {:?}: {}", path, e);
            let fallback = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            (fallback, None, None)
        }
    }
}

/// 提取 PDF 元数据
fn extract_pdf_metadata(_app_handle: &AppHandle, path: &Path) -> (String, Option<String>, Option<String>) {
    match metadata::extract_pdf_metadata(path) {
        Ok((title, author)) => {
            (title, author, None) // PDF 封面暂不提取
        }
        Err(e) => {
            log::warn!("Failed to extract PDF metadata from {:?}: {}", path, e);
            let fallback = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            (fallback, None, None)
        }
    }
}

/// 保存封面图片到缓存目录
fn save_cover_image(app_handle: &AppHandle, title: &str, data: &[u8]) -> Option<String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .ok()?;
    let covers_dir = app_data_dir.join("covers");
    std::fs::create_dir_all(&covers_dir).ok()?;

    // 生成唯一文件名
    let sanitized_title: String = title
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .take(50)
        .collect();
    let file_name = format!("{}_{}.jpg", sanitized_title, uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("0"));
    let cover_path = covers_dir.join(&file_name);

    if std::fs::write(&cover_path, data).is_ok() {
        Some(cover_path.to_string_lossy().to_string())
    } else {
        None
    }
}
