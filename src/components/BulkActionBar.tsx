import { confirm } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { openBookFile, updateBookField } from "../api/books";
import { useBookStore } from "../store/bookStore";
import { useState } from "react";
import * as tagsApi from "../api/tags";
import type { Tag } from "../api/types";

export function BulkActionBar() {
  const { selectedBookIds, clearSelection, deleteSelectedBooks, loadBooks, books, selectAllBooks } =
    useBookStore();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  if (selectedBookIds.length === 0) return null;

  const handleBatchTag = async () => {
    try {
      const tagList = await tagsApi.listTags();
      setTags(tagList);
      setShowTagPicker(!showTagPicker);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  };

  const handleAddTag = async (tagId: number) => {
    try {
      await tagsApi.addTagsToBooks(selectedBookIds, [tagId]);
      loadBooks();
      setShowTagPicker(false);
    } catch (e) {
      console.error("Failed to add tags:", e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bookshelf-card border-t border-bookshelf-border shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-bookshelf-text">
            已选择 {selectedBookIds.length} 本
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchTag}
              className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              批量打标签
            </button>
            <button
              onClick={async () => {
                for (const id of selectedBookIds) {
                  await updateBookField(id, "is_read", 1);
                }
                loadBooks();
              }}
              className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              标记已读
            </button>
            <button
              onClick={async () => {
                const confirmed = await confirm(
                  `确定删除 ${selectedBookIds.length} 本图书记录？此操作不可恢复。`,
                  { title: "删除确认", kind: "warning" }
                );
                if (confirmed) {
                  await deleteSelectedBooks();
                }
              }}
              className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              删除记录
            </button>
            <button
              onClick={selectAllBooks}
              className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              全选
            </button>
            {selectedBookIds.length === 1 && (() => {
              const book = books.find((b) => b.id === selectedBookIds[0]);
              if (!book) return null;
              return (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await revealItemInDir(book.file_path);
                      } catch (e) {
                        console.error("Failed to reveal in Finder:", e);
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    在 Finder 中显示
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await openBookFile(book.file_path);
                      } catch (e) {
                        console.error("Failed to open file:", e);
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    打开
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 标签选择器弹出 */}
          {showTagPicker && (
            <div className="absolute bottom-16 right-4 bg-white rounded-xl shadow-xl border border-bookshelf-border p-3 w-64 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium text-bookshelf-text-secondary mb-2">
                选择要添加的标签
              </p>
              {tags.length === 0 ? (
                <p className="text-xs text-bookshelf-text-secondary">暂无标签</p>
              ) : (
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                    >
                      {tag.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={clearSelection}
            className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消选择
          </button>
        </div>
      </div>
    </div>
  );
}
