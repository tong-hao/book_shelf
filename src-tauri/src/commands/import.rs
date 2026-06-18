use crate::models::CsvImportReport;
use crate::services::repository;
use tauri::command;

/// 批量导入 CSV 格式的图书标签
/// 每行格式：图书名称,标签1,标签2,...
/// 图书不存在时自动创建，标签不存在时自动创建
#[command]
pub fn import_books_csv(csv_text: String) -> Result<CsvImportReport, String> {
    repository::import_books_csv(&csv_text)
}
