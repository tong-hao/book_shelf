-- BookShelf 数据库 Schema
-- 图书主表
CREATE TABLE IF NOT EXISTS books (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path     TEXT NOT NULL UNIQUE,
  file_hash     TEXT,
  format        TEXT,
  title         TEXT NOT NULL,
  author        TEXT,
  cover_path    TEXT,
  file_size     INTEGER,
  added_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  rating        INTEGER CHECK(rating BETWEEN 0 AND 5) DEFAULT 0,
  is_read       INTEGER DEFAULT 0,
  liked         INTEGER DEFAULT 0,
  note_link     TEXT,
  remark        TEXT
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT
);

-- 图书-标签关联表
CREATE TABLE IF NOT EXISTS book_tags (
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- FTS5 全文搜索表（外部内容表）
CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
  title, author,
  content=books,
  content_rowid=id,
  tokenize='unicode61'
);

-- 触发器：保持 FTS 同步
CREATE TRIGGER IF NOT EXISTS books_ai AFTER INSERT ON books BEGIN
  INSERT INTO books_fts(rowid, title, author) VALUES (new.id, new.title, new.author);
END;

CREATE TRIGGER IF NOT EXISTS books_ad AFTER DELETE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author) VALUES('delete', old.id, old.title, old.author);
END;

CREATE TRIGGER IF NOT EXISTS books_au AFTER UPDATE ON books BEGIN
  INSERT INTO books_fts(books_fts, rowid, title, author) VALUES('delete', old.id, old.title, old.author);
  INSERT INTO books_fts(rowid, title, author) VALUES (new.id, new.title, new.author);
END;
