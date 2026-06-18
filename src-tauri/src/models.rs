use serde::{Deserialize, Serialize};

/// 图书主表模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: i64,
    pub file_path: String,
    pub file_hash: Option<String>,
    pub format: Option<String>,
    pub title: String,
    pub author: Option<String>,
    pub cover_path: Option<String>,
    pub file_size: Option<i64>,
    pub added_at: String,
    pub rating: i64,
    pub is_read: i64,
    pub liked: Option<i64>,
    pub note_link: Option<String>,
    pub remark: Option<String>,
}

/// 带标签的图书（用于列表展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookWithTags {
    #[serde(flatten)]
    pub book: Book,
    pub tags: Vec<Tag>,
}

/// 标签模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

/// 标签计数（用于侧栏展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagWithCount {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
    pub count: i64,
}

/// 扫描报告
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanReport {
    pub total: usize,
    pub added: usize,
    pub updated: usize,
    pub errors: Vec<String>,
}

/// 扫描进度事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub current: usize,
    pub total: usize,
    pub current_file: String,
}

/// CSV 导入报告
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsvImportReport {
    pub total_rows: usize,
    pub books_created: usize,
    pub books_found: usize,
    pub tags_created: usize,
    pub tag_associations: usize,
    pub errors: Vec<String>,
}

/// 搜索过滤参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchFilter {
    pub keyword: Option<String>,
    pub tag_ids: Option<Vec<i64>>,
    pub is_read: Option<i64>,
    pub min_rating: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}


