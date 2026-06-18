import { useEffect, useState } from "react";
import { useBookStore } from "../store/bookStore";
import { useUiStore } from "../store/uiStore";
import * as tagsApi from "../api/tags";
import type { TagWithCount } from "../api/tags";
import Tooltip from "./Tooltip";

export function Sidebar() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const { filteredTagIds, setFilteredTagIds, setSearchKeyword, searchKeyword } =
    useBookStore();
  const { sidebarOpen, toggleSidebar, setShowTagManager, tagVersion } = useUiStore();

  useEffect(() => {
    tagsApi.listTagsWithCount().then(setTags).catch(console.error);
  }, [filteredTagIds, tagVersion]); // tagVersion 变更时刷新（如标签管理关闭后）

  const toggleTag = (tagId: number) => {
    if (filteredTagIds.includes(tagId)) {
      setFilteredTagIds(filteredTagIds.filter((id) => id !== tagId));
    } else {
      setFilteredTagIds([...filteredTagIds, tagId]);
    }
  };

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="w-60 min-w-[240px] bg-bookshelf-sidebar border-r border-bookshelf-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-bookshelf-border flex items-center justify-between">
        <h2 className="font-semibold text-sm text-bookshelf-text">标签</h2>
        <div className="flex gap-1">
          <Tooltip content="标签管理">
            <button
              onClick={() => setShowTagManager(true)}
              className="p-1.5 rounded hover:bg-gray-300/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="p-3">
        <input
          type="text"
          placeholder="搜索书名/作者..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent focus:border-transparent"
        />
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {tags.length === 0 ? (
          <p className="text-xs text-bookshelf-text-secondary text-center py-4">
            暂无标签
          </p>
        ) : (
          <div className="space-y-0.5">
            <button
              onClick={() => setFilteredTagIds([])}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filteredTagIds.length === 0
                  ? "bg-bookshelf-accent text-white"
                  : "hover:bg-gray-300/50 text-bookshelf-text"
              }`}
            >
              全部图书
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  filteredTagIds.includes(tag.id)
                    ? "bg-bookshelf-accent text-white"
                    : "hover:bg-gray-300/50 text-bookshelf-text"
                }`}
              >
                <div className="flex items-center gap-2">
                  {tag.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  <span className="truncate">{tag.name}</span>
                </div>
                <span className={`text-xs ml-2 ${
                  filteredTagIds.includes(tag.id) ? "text-white/70" : "text-bookshelf-text-secondary"
                }`}>
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
