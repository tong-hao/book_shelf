use crate::models::*;
use crate::services::{scanner, search};
use tauri::command;
use tauri::AppHandle;

/// 扫描目录
#[command]
pub async fn scan_directory(app_handle: AppHandle, root: String) -> Result<ScanReport, String> {
    scanner::scan_directory(app_handle, &root)
}

/// 搜索图书
#[command]
pub fn search_books(filter: SearchFilter) -> Result<Vec<BookWithTags>, String> {
    search::search_books(&filter)
}
