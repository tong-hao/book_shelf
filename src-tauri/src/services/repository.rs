use crate::db;
use crate::models::*;
use rusqlite::params;

// ==================== 图书操作 ====================

/// 获取所有图书（带标签）
pub fn get_all_books() -> Result<Vec<BookWithTags>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_hash, format, title, author, cover_path,
                        file_size, added_at, rating, is_read, liked, note_link, remark
                 FROM books ORDER BY added_at DESC",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let books: Vec<Book> = stmt
            .query_map([], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_hash: row.get(2)?,
                    format: row.get(3)?,
                    title: row.get(4)?,
                    author: row.get(5)?,
                    cover_path: row.get(6)?,
                    file_size: row.get(7)?,
                    added_at: row.get(8)?,
                    rating: row.get(9)?,
                    is_read: row.get(10)?,
                    liked: row.get(11)?,
                    note_link: row.get(12)?,
                    remark: row.get(13)?,
                })
            })
            .map_err(|e| format!("Failed to query books: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        // 为每本书加载标签
        let mut tag_stmt = conn
            .prepare(
                "SELECT t.id, t.name, t.color FROM tags t
                 INNER JOIN book_tags bt ON bt.tag_id = t.id
                 WHERE bt.book_id = ?1",
            )
            .map_err(|e| format!("Failed to prepare tag query: {e}"))?;

        let mut result = Vec::new();
        for book in books {
            let tags: Vec<Tag> = tag_stmt
                .query_map(params![book.id], |row| {
                    Ok(Tag {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        color: row.get(2)?,
                    })
                })
                .map_err(|e| format!("Failed to query tags: {e}"))?
                .filter_map(|r| r.ok())
                .collect();

            result.push(BookWithTags {
                book,
                tags,
            });
        }

        Ok(result)
    })
}

/// 获取单本图书
pub fn get_book(book_id: i64) -> Result<Option<BookWithTags>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_hash, format, title, author, cover_path,
                        file_size, added_at, rating, is_read, liked, note_link, remark
                 FROM books WHERE id = ?1",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let mut rows = stmt
            .query_map(params![book_id], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_hash: row.get(2)?,
                    format: row.get(3)?,
                    title: row.get(4)?,
                    author: row.get(5)?,
                    cover_path: row.get(6)?,
                    file_size: row.get(7)?,
                    added_at: row.get(8)?,
                    rating: row.get(9)?,
                    is_read: row.get(10)?,
                    liked: row.get(11)?,
                    note_link: row.get(12)?,
                    remark: row.get(13)?,
                })
            })
            .map_err(|e| format!("Failed to query book: {e}"))?;

        if let Some(book_row) = rows.next() {
            if let Ok(book) = book_row {
                let mut tag_stmt = conn
                    .prepare(
                        "SELECT t.id, t.name, t.color FROM tags t
                         INNER JOIN book_tags bt ON bt.tag_id = t.id
                         WHERE bt.book_id = ?1",
                    )
                    .map_err(|e| format!("Failed to prepare tag query: {e}"))?;

                let tags: Vec<Tag> = tag_stmt
                    .query_map(params![book_id], |row| {
                        Ok(Tag {
                            id: row.get(0)?,
                            name: row.get(1)?,
                            color: row.get(2)?,
                        })
                    })
                    .map_err(|e| format!("Failed to query tags: {e}"))?
                    .filter_map(|r| r.ok())
                    .collect();

                return Ok(Some(BookWithTags { book, tags }));
            }
        }
        Ok(None)
    })
}

/// 插入新图书
pub fn insert_book(book: &Book) -> Result<i64, String> {
    db::with_db(|conn| {
        conn.execute(
            "INSERT INTO books (file_path, file_hash, format, title, author, cover_path, file_size)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                book.file_path,
                book.file_hash,
                book.format,
                book.title,
                book.author,
                book.cover_path,
                book.file_size,
            ],
        )
        .map_err(|e| format!("Failed to insert book: {e}"))?;

        Ok(conn.last_insert_rowid())
    })
}

/// 根据 file_hash 查找图书（用于去重）
pub fn find_book_by_hash(hash: &str) -> Result<Option<Book>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_hash, format, title, author, cover_path,
                        file_size, added_at, rating, is_read, liked, note_link, remark
                 FROM books WHERE file_hash = ?1 LIMIT 1",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let mut rows = stmt
            .query_map(params![hash], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_hash: row.get(2)?,
                    format: row.get(3)?,
                    title: row.get(4)?,
                    author: row.get(5)?,
                    cover_path: row.get(6)?,
                    file_size: row.get(7)?,
                    added_at: row.get(8)?,
                    rating: row.get(9)?,
                    is_read: row.get(10)?,
                    liked: row.get(11)?,
                    note_link: row.get(12)?,
                    remark: row.get(13)?,
                })
            })
            .map_err(|e| format!("Failed to query book by hash: {e}"))?;

        Ok(rows.next().and_then(|r| r.ok()))
    })
}

/// 更新图书文件路径（文件移动时）
pub fn update_book_path(book_id: i64, new_path: &str) -> Result<(), String> {
    db::with_db(|conn| {
        conn.execute(
            "UPDATE books SET file_path = ?1 WHERE id = ?2",
            params![new_path, book_id],
        )
        .map_err(|e| format!("Failed to update book path: {e}"))?;
        Ok(())
    })
}

/// 更新图书字段（个人标注）
pub fn update_book_field(book_id: i64, field: &str, value: &serde_json::Value) -> Result<(), String> {
    // 白名单校验
    let allowed_fields = [
        "rating", "is_read", "liked", "note_link", "remark", "title", "author",
    ];
    if !allowed_fields.contains(&field) {
        return Err(format!("Field '{}' is not allowed for update", field));
    }

    let sql = format!("UPDATE books SET {} = ?1 WHERE id = ?2", field);

    db::with_db(|conn| {
        match value {
            serde_json::Value::String(s) => {
                conn.execute(&sql, params![s, book_id])
                    .map_err(|e| format!("Failed to update field: {e}"))?;
            }
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    conn.execute(&sql, params![i, book_id])
                        .map_err(|e| format!("Failed to update field: {e}"))?;
                } else if let Some(f) = n.as_f64() {
                    conn.execute(&sql, params![f, book_id])
                        .map_err(|e| format!("Failed to update field: {e}"))?;
                }
            }
            serde_json::Value::Bool(b) => {
                let v: i64 = if *b { 1 } else { 0 };
                conn.execute(&sql, params![v, book_id])
                    .map_err(|e| format!("Failed to update field: {e}"))?;
            }
            serde_json::Value::Null => {
                conn.execute(&sql, params![rusqlite::types::Null, book_id])
                    .map_err(|e| format!("Failed to update field: {e}"))?;
            }
            _ => {
                return Err(format!("Unsupported value type for field '{}'", field));
            }
        }
        Ok(())
    })
}

/// 更新图书封面路径
pub fn update_book_cover(book_id: i64, cover_path: &str) -> Result<(), String> {
    db::with_db(|conn| {
        conn.execute(
            "UPDATE books SET cover_path = ?1 WHERE id = ?2",
            params![cover_path, book_id],
        )
        .map_err(|e| format!("Failed to update cover path: {e}"))?;
        Ok(())
    })
}

/// 删除图书（仅删除记录，不删除文件）
pub fn delete_book(book_id: i64) -> Result<(), String> {
    db::with_db(|conn| {
        conn.execute("DELETE FROM books WHERE id = ?1", params![book_id])
            .map_err(|e| format!("Failed to delete book: {e}"))?;
        Ok(())
    })
}

/// 批量删除图书
pub fn delete_books(book_ids: &[i64]) -> Result<usize, String> {
    db::with_db(|conn| {
        let mut count = 0;
        for id in book_ids {
            let affected = conn
                .execute("DELETE FROM books WHERE id = ?1", params![id])
                .map_err(|e| format!("Failed to delete book {id}: {e}"))?;
            count += affected;
        }
        Ok(count)
    })
}

// ==================== 标签操作 ====================

/// 获取所有标签
pub fn list_tags() -> Result<Vec<Tag>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, name, color FROM tags ORDER BY name")
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let tags = stmt
            .query_map([], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                })
            })
            .map_err(|e| format!("Failed to query tags: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(tags)
    })
}

/// 获取标签及其图书数量
pub fn list_tags_with_count() -> Result<Vec<TagWithCount>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.name, t.color, COUNT(bt.book_id) as count
                 FROM tags t
                 LEFT JOIN book_tags bt ON bt.tag_id = t.id
                 GROUP BY t.id
                 ORDER BY t.name",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let tags = stmt
            .query_map([], |row| {
                Ok(TagWithCount {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    count: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to query tags with count: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(tags)
    })
}

/// 创建标签
pub fn create_tag(name: &str, color: Option<&str>) -> Result<Tag, String> {
    db::with_db(|conn| {
        conn.execute(
            "INSERT INTO tags (name, color) VALUES (?1, ?2)",
            params![name, color],
        )
        .map_err(|e| format!("Failed to create tag: {e}"))?;

        let id = conn.last_insert_rowid();
        Ok(Tag {
            id,
            name: name.to_string(),
            color: color.map(|c| c.to_string()),
        })
    })
}

/// 删除标签
pub fn delete_tag(tag_id: i64) -> Result<(), String> {
    db::with_db(|conn| {
        conn.execute("DELETE FROM tags WHERE id = ?1", params![tag_id])
            .map_err(|e| format!("Failed to delete tag: {e}"))?;
        Ok(())
    })
}

/// 批量给图书打标签
pub fn add_tags_to_books(book_ids: &[i64], tag_ids: &[i64]) -> Result<usize, String> {
    db::with_db(|conn| {
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("Failed to start transaction: {e}"))?;

        let mut count = 0;
        for book_id in book_ids {
            for tag_id in tag_ids {
                let affected = tx
                    .execute(
                        "INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?1, ?2)",
                        params![book_id, tag_id],
                    )
                    .map_err(|e| format!("Failed to insert book_tag: {e}"))?;
                count += affected;
            }
        }

        tx.commit().map_err(|e| format!("Failed to commit: {e}"))?;
        Ok(count)
    })
}

/// 移除图书的某个标签
pub fn remove_tag_from_book(book_id: i64, tag_id: i64) -> Result<(), String> {
    db::with_db(|conn| {
        conn.execute(
            "DELETE FROM book_tags WHERE book_id = ?1 AND tag_id = ?2",
            params![book_id, tag_id],
        )
        .map_err(|e| format!("Failed to remove tag: {e}"))?;
        Ok(())
    })
}

/// 检查文件路径是否已存在
pub fn find_book_by_path(path: &str) -> Result<Option<Book>, String> {
    db::with_db(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_hash, format, title, author, cover_path,
                        file_size, added_at, rating, is_read, liked, note_link, remark
                 FROM books WHERE file_path = ?1 LIMIT 1",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let mut rows = stmt
            .query_map(params![path], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_hash: row.get(2)?,
                    format: row.get(3)?,
                    title: row.get(4)?,
                    author: row.get(5)?,
                    cover_path: row.get(6)?,
                    file_size: row.get(7)?,
                    added_at: row.get(8)?,
                    rating: row.get(9)?,
                    is_read: row.get(10)?,
                    liked: row.get(11)?,
                    note_link: row.get(12)?,
                    remark: row.get(13)?,
                })
            })
            .map_err(|e| format!("Failed to query book by path: {e}"))?;

        Ok(rows.next().and_then(|r| r.ok()))
    })
}
