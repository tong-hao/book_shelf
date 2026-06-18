use crate::models::*;
use crate::services::repository;
use tauri::command;

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
