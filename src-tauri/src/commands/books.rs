use std::path::Path;

use crate::models::*;
use crate::services::repository;
use tauri::command;
use tauri::Manager;

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

/// 更换图书封面
#[command]
pub fn update_book_cover(
    app_handle: tauri::AppHandle,
    book_id: i64,
    image_path: String,
) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    let covers_dir = app_data_dir.join("covers");
    std::fs::create_dir_all(&covers_dir)
        .map_err(|e| format!("Failed to create covers dir: {e}"))?;

    let source = Path::new(&image_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    // 生成唯一文件名
    let file_name = format!(
        "custom_{}_{}.{}",
        uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("0"),
        book_id,
        ext
    );
    let dest_path = covers_dir.join(&file_name);

    // 复制图片到 covers 目录
    std::fs::copy(source, &dest_path)
        .map_err(|e| format!("Failed to copy image: {e}"))?;

    let dest_str = dest_path.to_string_lossy().to_string();

    // 更新数据库
    repository::update_book_cover(book_id, &dest_str)?;

    Ok(dest_str)
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
