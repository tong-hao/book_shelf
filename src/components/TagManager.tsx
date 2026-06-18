import { useState, useEffect } from "react";
import { useUiStore } from "../store/uiStore";
import * as tagsApi from "../api/tags";
import type { TagWithCount } from "../api/tags";

export function TagManager() {
  const { showTagManager, setShowTagManager, bumpTagVersion } = useUiStore();
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  const loadTags = async () => {
    try {
      const result = await tagsApi.listTagsWithCount();
      setTags(result);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  };

  useEffect(() => {
    if (showTagManager) {
      loadTags();
    }
  }, [showTagManager]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await tagsApi.createTag(newTagName.trim(), newTagColor);
      setNewTagName("");
      bumpTagVersion();
      loadTags();
    } catch (e) {
      console.error("Failed to create tag:", e);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      await tagsApi.deleteTag(tagId);
      bumpTagVersion();
      loadTags();
    } catch (e) {
      console.error("Failed to delete tag:", e);
    }
  };

  if (!showTagManager) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[420px] max-w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bookshelf-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bookshelf-text">标签管理</h2>
          <button
            onClick={() => setShowTagManager(false)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* 创建新标签 */}
          <div>
            <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
              新建标签
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-bookshelf-border"
              />
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="标签名称..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-bookshelf-border focus:outline-none focus:ring-2 focus:ring-bookshelf-accent focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                }}
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-4 py-2 text-sm bg-bookshelf-accent text-white rounded-lg hover:bg-bookshelf-accent-hover transition-colors disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>

          {/* 标签列表 */}
          <div>
            <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
              现有标签（{tags.length}）
            </label>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {tags.length === 0 ? (
                <p className="text-sm text-bookshelf-text-secondary py-4 text-center">
                  暂无标签
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {tag.color && (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <span className="text-sm text-bookshelf-text">{tag.name}</span>
                      <span className="text-xs text-bookshelf-text-secondary">
                        ({tag.count})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bookshelf-border flex justify-end">
          <button
            onClick={() => setShowTagManager(false)}
            className="px-4 py-2 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
