use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

/// 全局数据库连接（单例）
static DB_INSTANCE: once_cell::sync::Lazy<Mutex<Option<rusqlite::Connection>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

/// 初始化数据库：创建/打开 SQLite 文件并执行 Schema
pub fn initialize(db_path: &Path) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open database: {e}"))?;

    // 启用外键约束
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to enable foreign keys: {e}"))?;

    // 执行 Schema
    let schema = include_str!("schema.sql");
    conn.execute_batch(schema)
        .map_err(|e| format!("Failed to execute schema: {e}"))?;

    // 存储全局连接
    let mut instance = DB_INSTANCE
        .lock()
        .map_err(|e| format!("Failed to lock DB instance: {e}"))?;
    *instance = Some(conn);

    Ok(())
}

/// 获取全局数据库连接
pub fn get_connection() -> Result<std::sync::MutexGuard<'static, Option<rusqlite::Connection>>, String> {
    DB_INSTANCE
        .lock()
        .map_err(|e| format!("Failed to lock DB instance: {e}"))
}

/// 执行数据库操作的回调函数
pub fn with_db<F, T>(f: F) -> Result<T, String>
where
    F: FnOnce(&rusqlite::Connection) -> Result<T, String>,
{
    let guard = get_connection()?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    f(conn)
}
