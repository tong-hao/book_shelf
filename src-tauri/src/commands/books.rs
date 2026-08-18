use crate::models::*;
use crate::services::repository;
use tauri::command;
use image::imageops::FilterType;
use image::GenericImageView;

/// 处理封面图片：解码、缩放、转换为 JPG
/// 缩放策略：固定宽度 300px，高度按比例，不放大小图
fn process_cover_image(data: &[u8]) -> Result<Vec<u8>, String> {
    // 解码图片（支持 PNG、JPEG、WebP、GIF 等格式）
    let img = image::load_from_memory(data)
        .map_err(|e| format!("Failed to decode image: {e}"))?;

    // 获取原始尺寸
    let (width, height) = img.dimensions();

    // 固定宽度 300px，高度按比例缩放，不放大
    let (new_width, new_height) = if width > 300 {
        let new_width = 300u32;
        let new_height = (height as f32 * new_width as f32 / width as f32) as u32;
        (new_width, new_height)
    } else {
        // 不放大小图，保持原尺寸
        (width, height)
    };

    // 缩放图片
    let resized = if width > 300 {
        // resize 返回 Rgba 格式，需要转换为 Rgb
        let rgba = image::imageops::resize(&img, new_width, new_height, FilterType::Lanczos3);
        image::DynamicImage::ImageRgba8(rgba).to_rgb8()
    } else {
        img.to_rgb8()
    };

    // 编码为 JPEG，质量 85%
    let mut output = std::io::Cursor::new(Vec::new());
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, 85);
    encoder.encode(
        resized.as_raw().as_slice(),
        new_width,
        new_height,
        image::ExtendedColorType::from(image::ColorType::Rgb8),
    ).map_err(|e| format!("Failed to encode JPEG: {e}"))?;

    Ok(output.into_inner())
}

/// 保存封面图片到 covers 目录
fn save_cover_image(book_id: i64, image_data: &[u8]) -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| format!("HOME not set: {e}"))?;
    let covers_dir = std::path::PathBuf::from(&home).join(".book_shelf").join("covers");
    std::fs::create_dir_all(&covers_dir)
        .map_err(|e| format!("Failed to create covers dir: {e}"))?;

    // 生成唯一文件名，统一使用 .jpg 扩展名
    let file_name = format!(
        "custom_{}_{}.jpg",
        uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("0"),
        book_id
    );
    let dest_path = covers_dir.join(&file_name);

    // 写入文件
    std::fs::write(&dest_path, image_data)
        .map_err(|e| format!("Failed to write image: {e}"))?;

    Ok(dest_path.to_string_lossy().to_string())
}

/// 获取所有图书
#[command]
pub fn get_books() -> Result<Vec<BookWithTags>, String> {
    repository::get_all_books()
}

/// 获取单本图书详情
#[command]
pub fn get_book(book_id: i64) -> Result<Option<BookWithTags>, String> {
    repository::get_book(book_id)
}

/// 更新图书字段（个人标注）
#[command]
pub fn update_book_field(book_id: i64, field: String, value: serde_json::Value) -> Result<(), String> {
    repository::update_book_field(book_id, &field, &value)
}

/// 删除图书记录
#[command]
pub fn delete_book(book_id: i64) -> Result<(), String> {
    repository::delete_book(book_id)
}

/// 批量删除图书记录
#[command]
pub fn delete_books(book_ids: Vec<i64>) -> Result<usize, String> {
    repository::delete_books(&book_ids)
}

/// 更换图书封面（通过文件路径）
#[command]
pub fn update_book_cover(
    book_id: i64,
    image_path: String,
) -> Result<String, String> {
    // 读取原文件
    let image_data = std::fs::read(&image_path)
        .map_err(|e| format!("Failed to read image file: {e}"))?;

    // 处理图片：缩放、转换为 JPG
    let processed_data = process_cover_image(&image_data)?;

    // 保存处理后的图片
    let dest_path = save_cover_image(book_id, &processed_data)?;

    // 更新数据库
    repository::update_book_cover(book_id, &dest_path)?;

    Ok(dest_path)
}

/// 更换图书封面（通过 Base64 数据，用于粘贴上传）
#[command]
pub fn update_book_cover_from_base64(
    book_id: i64,
    image_base64: String,
) -> Result<String, String> {
    // 去掉 data:image/xxx;base64, 前缀（如果存在）
    let base64_data = if image_base64.contains(",") {
        image_base64.split(",").nth(1).unwrap_or(&image_base64)
    } else {
        &image_base64
    };

    // 解码 Base64（使用新的 Engine API）
    use base64::{Engine as _, engine::general_purpose};
    let image_data = general_purpose::STANDARD.decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {e}"))?;

    // 处理图片：缩放、转换为 JPG
    let processed_data = process_cover_image(&image_data)?;

    // 保存处理后的图片
    let dest_path = save_cover_image(book_id, &processed_data)?;

    // 更新数据库
    repository::update_book_cover(book_id, &dest_path)?;

    Ok(dest_path)
}

/// 用系统默认应用打开图书文件
#[command]
pub fn open_book_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {e}"))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {e}"))?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {e}"))?;
    }
    Ok(())
}
