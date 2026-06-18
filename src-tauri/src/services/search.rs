use crate::db;
use crate::models::*;
use rusqlite::params;

/// 搜索图书
/// 支持 FTS5 全文搜索和 LIKE 兜底（中文）
pub fn search_books(filter: &SearchFilter) -> Result<Vec<BookWithTags>, String> {
    db::with_db(|conn| {
        let has_keyword = filter.keyword.as_ref().map_or(false, |k| !k.is_empty());
        let has_tags = filter.tag_ids.as_ref().map_or(false, |ids| !ids.is_empty());
        let has_read_filter = filter.is_read.is_some();
        let has_rating_filter = filter.min_rating.is_some();

        // 构建查询
        let mut sql = String::from(
            "SELECT DISTINCT b.id, b.file_path, b.file_hash, b.format, b.title, b.author,
                    b.cover_path, b.file_size, b.added_at, b.rating, b.is_read,
                    b.liked, b.note_link, b.remark
             FROM books b"
        );

        let mut conditions: Vec<String> = Vec::new();
        let mut join_clauses: Vec<String> = Vec::new();

        if has_tags {
            join_clauses.push(
                "INNER JOIN book_tags bt ON bt.book_id = b.id".to_string()
            );
            conditions.push(format!(
                "bt.tag_id IN ({})",
                filter
                    .tag_ids
                    .as_ref()
                    .unwrap()
                    .iter()
                    .map(|_| "?")
                    .collect::<Vec<_>>()
                    .join(",")
            ));
        }

        if has_keyword {
            if let Some(ref kw) = filter.keyword {
                if !kw.is_empty() {
                    // FTS5 与 LIKE 用 OR 组合：优先 FTS5 精确匹配，LIKE 兜底中文
                    conditions.push(format!(
                        "(b.id IN (SELECT rowid FROM books_fts WHERE books_fts MATCH ?) \
                         OR b.title LIKE ? OR b.author LIKE ?)"
                    ));
                }
            }
        }

        if has_read_filter {
            conditions.push("b.is_read = ?".to_string());
        }

        if has_rating_filter {
            conditions.push("b.rating >= ?".to_string());
        }

        // 组装 SQL
        for join in &join_clauses {
            sql.push_str(&format!(" {}", join));
        }

        if !conditions.is_empty() {
            sql.push_str(" WHERE ");
            sql.push_str(&conditions.join(" AND "));
        }

        // 多标签时使用 GROUP BY + HAVING 确保匹配所有选中标签（交集）
        if has_tags {
            let tag_count = filter.tag_ids.as_ref().unwrap().len();
            if tag_count > 1 {
                sql.push_str(" GROUP BY b.id");
                sql.push_str(&format!(" HAVING COUNT(DISTINCT bt.tag_id) = {}", tag_count));
            }
        }

        // 排序
        let sort_by = filter.sort_by.as_deref().unwrap_or("added_at");
        let sort_order = filter.sort_order.as_deref().unwrap_or("DESC");
        let allowed_sort_fields = ["added_at", "title", "author", "rating", "file_size", "format", "is_read"];
        if allowed_sort_fields.contains(&sort_by) {
            sql.push_str(&format!(" ORDER BY b.{} {}", sort_by, sort_order));
        } else {
            sql.push_str(" ORDER BY b.added_at DESC");
        }

        // 准备参数
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if has_tags {
            for tag_id in filter.tag_ids.as_ref().unwrap() {
                param_values.push(Box::new(*tag_id));
            }
        }

        if has_keyword {
            if let Some(ref kw) = filter.keyword {
                // FTS5 查询词
                let fts_query = kw
                    .split_whitespace()
                    .map(|w| format!("\"{}\"", w.replace('"', "")))
                    .collect::<Vec<_>>()
                    .join(" OR ");
                param_values.push(Box::new(fts_query));

                // LIKE 兜底
                let like_pattern = format!("%{}%", kw.replace('%', "%%"));
                param_values.push(Box::new(like_pattern.clone()));
                param_values.push(Box::new(like_pattern));
            }
        }

        if has_read_filter {
            param_values.push(Box::new(filter.is_read.unwrap()));
        }

        if has_rating_filter {
            param_values.push(Box::new(filter.min_rating.unwrap()));
        }

        // 将参数转为引用切片
        let params_refs: Vec<&dyn rusqlite::types::ToSql> =
            param_values.iter().map(|p| p.as_ref()).collect();

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| format!("Failed to prepare search query: {e} (SQL: {sql})"))?;

        let books: Vec<Book> = stmt
            .query_map(params_refs.as_slice(), |row| {
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
            .map_err(|e| format!("Failed to execute search: {e}"))?
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

            result.push(BookWithTags { book, tags });
        }

        Ok(result)
    })
}
