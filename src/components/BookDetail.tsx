import { useBookStore } from "../store/bookStore";
import { open } from "@tauri-apps/plugin-shell";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";
import * as tagsApi from "../api/tags";
import type { Tag } from "../api/types";
import { useUiStore } from "../store/uiStore";
import Tooltip from "./Tooltip";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { updateBookCover } from "../api/books";

export function BookDetail() {
  const { selectedBook, selectedBookIds, updateBookField } = useBookStore();
  const { multiSelect } = useUiStore();
  const isMultiSelecting = multiSelect && selectedBookIds.length > 1;
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [authorInput, setAuthorInput] = useState("");

  const handleChangeCover = async () => {
    if (!selectedBook || coverUploading) return;
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: "图片",
            extensions: ["png", "jpg", "jpeg", "webp", "gif"],
          },
        ],
      });
      if (!selected) return;
      setCoverUploading(true);
      await updateBookCover(selectedBook.id, selected);
      useBookStore.getState().loadBooks();
    } catch (e) {
      console.error("Failed to change cover:", e);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!selectedBook) return;
    setEditingTitle(false);
    await updateBookField(selectedBook.id, "title", titleInput);
  };

  const handleSaveAuthor = async () => {
    if (!selectedBook) return;
    setEditingAuthor(false);
    await updateBookField(selectedBook.id, "author", authorInput);
  };

  // 加载标签列表
  const loadTags = async () => {
    try {
      const tags = await tagsApi.listTags();
      setAllTags(tags);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  };

  const handleOpenTagSelector = () => {
    loadTags();
    setShowTagSelector(!showTagSelector);
  };

  const handleAddTag = async (tagId: number) => {
    if (!selectedBook) return;
    try {
      await tagsApi.addTagsToBooks([selectedBook.id], [tagId]);
      useBookStore.getState().loadBooks();
    } catch (e) {
      console.error("Failed to add tag:", e);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!selectedBook) return;
    try {
      await tagsApi.removeTagFromBook(selectedBook.id, tagId);
      useBookStore.getState().loadBooks();
    } catch (e) {
      console.error("Failed to remove tag:", e);
    }
  };

  const handleOpenNoteLink = async () => {
    if (!selectedBook?.note_link) return;
    try {
      await open(selectedBook.note_link);
    } catch (e) {
      console.error("Failed to open note link:", e);
    }
  };

  if (!selectedBook) {
    return (
      <div className="w-80 min-w-[320px] bg-bookshelf-card border-l border-bookshelf-border p-6 flex items-center justify-center">
        <p className="text-sm text-bookshelf-text-secondary text-center">
          选择一本书查看详情
        </p>
      </div>
    );
  }

  const book = selectedBook;

  // 多选模式：显示置灰提示
  if (isMultiSelecting) {
    return (
      <div className="w-80 min-w-[320px] bg-bookshelf-card border-l border-bookshelf-border flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-bookshelf-text-secondary/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
            <p className="text-sm text-bookshelf-text-secondary">
              已选择 <span className="font-semibold">{selectedBookIds.length}</span> 本图书
            </p>
            <p className="text-xs text-bookshelf-text-secondary/60 mt-1">
              多选模式下请在底部批量操作
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 min-w-[320px] bg-bookshelf-card border-l border-bookshelf-border flex flex-col h-full overflow-y-auto">
      {/* 封面（点击更换） */}
      <div
        className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center group cursor-pointer overflow-hidden"
        onClick={handleChangeCover}
      >
        {book.cover_path ? (
          <img
            key={book.cover_path || 'no-cover'}
            src={convertFileSrc(book.cover_path || '')}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-6xl font-bold text-gray-300">
            {book.title.charAt(0).toUpperCase()}
          </span>
        )}

        {/* hover 遮罩 + 更换封面提示 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">
              {coverUploading ? "上传中..." : "更换封面"}
            </span>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="p-4 space-y-4">
        <div>
          {editingTitle ? (
            <input
              type="text"
              className="w-full text-lg font-semibold text-bookshelf-text px-2 py-1 rounded border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold text-bookshelf-text cursor-pointer hover:text-bookshelf-accent"
              onClick={() => {
                setTitleInput(book.title);
                setEditingTitle(true);
              }}
            >
              {book.title}
            </h2>
          )}
          <div className="mt-1">
            {editingAuthor ? (
              <input
                type="text"
                className="w-full px-2 py-1 text-sm rounded border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onBlur={handleSaveAuthor}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAuthor();
                  if (e.key === "Escape") setEditingAuthor(false);
                }}
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-bookshelf-text-secondary cursor-pointer hover:text-bookshelf-accent"
                onClick={() => {
                  setAuthorInput(book.author || "");
                  setEditingAuthor(true);
                }}
              >
                {book.author || "点击设置作者"}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 text-xs text-bookshelf-text-secondary">
          {book.format && (
            <span className="bg-gray-100 px-2 py-1 rounded">{book.format.toUpperCase()}</span>
          )}
          {book.file_size && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {formatFileSize(book.file_size)}
            </span>
          )}
        </div>

        {/* 评分 */}
        <div>
          <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
            评分
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateBookField(book.id, "rating", star)}
                className={`text-lg transition-colors ${
                  star <= book.rating
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* 已读 */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-bookshelf-text-secondary">
            已读
          </label>
          <button
            onClick={() =>
              updateBookField(book.id, "is_read", book.is_read === 1 ? 0 : 1)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              book.is_read === 1 ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                book.is_read === 1 ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* 喜欢 */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-bookshelf-text-secondary">
            喜欢
          </label>
          <button
            onClick={() =>
              updateBookField(book.id, "liked", book.liked === 1 ? 0 : 1)
            }
            className={`text-xl transition-colors ${
              book.liked === 1 ? "text-red-500" : "text-gray-300 hover:text-red-300"
            }`}
          >
            {book.liked === 1 ? "♥" : "♡"}
          </button>
        </div>

        {/* 标签 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-bookshelf-text-secondary">
              标签
            </label>
            <button
              onClick={handleOpenTagSelector}
              className="text-xs text-bookshelf-accent hover:text-bookshelf-accent-hover"
            >
              {showTagSelector ? "完成" : "编辑"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {book.tags.length === 0 && !showTagSelector && (
              <span className="text-xs text-bookshelf-text-secondary">无标签</span>
            )}
            {book.tags.map((tag) => (
              <span
                key={tag.id}
                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  tag.color
                    ? "text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
                style={tag.color ? { backgroundColor: tag.color } : undefined}
              >
                {tag.name}
                {showTagSelector && (
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-0.5 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {/* 添加标签选择器 */}
          {showTagSelector && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {allTags
                .filter((t) => !book.tags.some((bt) => bt.id === t.id))
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 text-bookshelf-text"
                  >
                    + {tag.name}
                  </button>
                ))}
              {allTags.filter((t) => !book.tags.some((bt) => bt.id === t.id)).length === 0 && (
                <p className="text-xs text-bookshelf-text-secondary">没有更多标签</p>
              )}
            </div>
          )}
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
            备注
          </label>
          <textarea
            value={book.remark || ""}
            onChange={(e) => updateBookField(book.id, "remark", e.target.value)}
            placeholder="添加备注..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent focus:border-transparent resize-none h-20"
          />
        </div>

        {/* 笔记链接 */}
        <div>
          <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
            笔记链接
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={book.note_link || ""}
              onChange={(e) => updateBookField(book.id, "note_link", e.target.value)}
              placeholder="URL 或本地路径..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent focus:border-transparent"
            />
            {book.note_link && (
              <Tooltip content="打开链接">
                <button
                  onClick={handleOpenNoteLink}
                  className="px-2 py-2 text-sm text-bookshelf-accent hover:text-bookshelf-accent-hover"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* 操作按钮（已移至底部批量操作栏） */}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
