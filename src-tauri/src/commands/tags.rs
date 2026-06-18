use crate::models::*;
use crate::services::repository;
use tauri::command;

/// 获取所有标签
#[command]
pub fn list_tags() -> Result<Vec<Tag>, String> {
    repository::list_tags()
}

/// 获取标签及其图书数量
#[command]
pub fn list_tags_with_count() -> Result<Vec<TagWithCount>, String> {
    repository::list_tags_with_count()
}

/// 创建标签
#[command]
pub fn create_tag(name: String, color: Option<String>) -> Result<Tag, String> {
    repository::create_tag(&name, color.as_deref())
}

/// 删除标签
#[command]
pub fn delete_tag(tag_id: i64) -> Result<(), String> {
    repository::delete_tag(tag_id)
}

/// 批量给图书打标签
#[command]
pub fn add_tags_to_books(book_ids: Vec<i64>, tag_ids: Vec<i64>) -> Result<usize, String> {
    repository::add_tags_to_books(&book_ids, &tag_ids)
}

/// 移除图书的标签
#[command]
pub fn remove_tag_from_book(book_id: i64, tag_id: i64) -> Result<(), String> {
    repository::remove_tag_from_book(book_id, tag_id)
}
