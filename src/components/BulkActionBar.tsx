import { useBookStore } from "../store/bookStore";
import { useState } from "react";
import * as tagsApi from "../api/tags";
import type { Tag } from "../api/types";

export function BulkActionBar() {
  const { selectedBookIds, clearSelection, deleteSelectedBooks, loadBooks } =
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
              className="px-3 py-1.5 text-sm bg-bookshelf-accent text-white rounded-lg hover:bg-bookshelf-accent-hover transition-colors"
            >
              批量打标签
            </button>
            <button
              onClick={async () => {
                for (const id of selectedBookIds) {
                  await import("../api/books").then((m) =>
                    m.updateBookField(id, "is_read", 1)
                  );
                }
                loadBooks();
              }}
              className="px-3 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              标记已读
            </button>
            <button
              onClick={async () => {
                if (confirm(`确定删除 ${selectedBookIds.length} 本图书记录？`)) {
                  await deleteSelectedBooks();
                }
              }}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              删除记录
            </button>
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
