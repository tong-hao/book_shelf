import { Sidebar } from "../components/Sidebar";
import { BookGrid } from "../components/BookGrid";
import { BookDetail } from "../components/BookDetail";
import { ScanDialog } from "../components/ScanDialog";
import { TagManager } from "../components/TagManager";
import { BulkActionBar } from "../components/BulkActionBar";
import { useBooks } from "../hooks/useBooks";
import { useUiStore } from "../store/uiStore";
import { useBookStore } from "../store/bookStore";
import Tooltip from "../components/Tooltip";
import { useState, useRef, useEffect } from "react";

const SORT_OPTIONS = [
  { label: "添加时间", field: "added_at", order: "DESC" },
  { label: "书名 ↑", field: "title", order: "ASC" },
  { label: "书名 ↓", field: "title", order: "DESC" },
  { label: "作者 ↑", field: "author", order: "ASC" },
  { label: "作者 ↓", field: "author", order: "DESC" },
  { label: "格式", field: "format", order: "ASC" },
  { label: "评分 ↑", field: "rating", order: "ASC" },
  { label: "评分 ↓", field: "rating", order: "DESC" },
  { label: "已读", field: "is_read", order: "DESC" },
];

export function Home() {
  const { books, isLoading } = useBooks();
  const { setShowScanDialog, toggleSidebar, viewMode, setViewMode, multiSelect, setMultiSelect } =
    useUiStore();
  const { sortBy, sortOrder, setSortBy } = useBookStore();
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const currentSortLabel = SORT_OPTIONS.find(
    (o) => o.field === sortBy && o.order === sortOrder
  )?.label || "排序";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-bookshelf-card/80 backdrop-blur-sm border-b border-bookshelf-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Tooltip content="切换侧栏">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </Tooltip>
          <h1 className="text-lg font-semibold text-bookshelf-text">书架</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex border border-bookshelf-border rounded-lg overflow-hidden mr-2">
            <Tooltip content="网格视图">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${
                  viewMode === "grid"
                    ? "bg-bookshelf-accent text-white"
                    : "hover:bg-gray-100 text-bookshelf-text-secondary"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="列表视图">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${
                  viewMode === "list"
                    ? "bg-bookshelf-accent text-white"
                    : "hover:bg-gray-100 text-bookshelf-text-secondary"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* 排序 */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-2 py-1.5 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-100 transition-colors text-bookshelf-text-secondary whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h14M3 12h10M3 20h6" />
              </svg>
              {currentSortLabel}
              <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-bookshelf-border py-1 w-32 z-50">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={`${opt.field}-${opt.order}`}
                    onClick={() => {
                      setSortBy(opt.field, opt.order);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                      sortBy === opt.field && sortOrder === opt.order
                        ? "text-bookshelf-accent font-medium"
                        : "text-bookshelf-text"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 单选/多选切换 */}
          <Tooltip content={multiSelect ? "切换为单选" : "切换为多选"}>
            <button
              onClick={() => {
                if (multiSelect) {
                  // 关闭多选时清除所有选中
                  setMultiSelect(false);
                  useBookStore.getState().clearSelection();
                } else {
                  setMultiSelect(true);
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                multiSelect
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "border border-bookshelf-border hover:bg-gray-100 text-bookshelf-text-secondary"
              }`}
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {multiSelect ? "多选" : "单选"}
          </button>
        </Tooltip>

          <button
            onClick={() => setShowScanDialog(true)}
            className="px-3 py-1.5 text-sm bg-bookshelf-accent text-white rounded-lg hover:bg-bookshelf-accent-hover transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            扫描
          </button>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bookshelf-bg">
          <BookGrid books={books} isLoading={isLoading} />
        </main>
        <BookDetail />
      </div>

      {/* 批量操作栏 */}
      <BulkActionBar />

      {/* 弹窗 */}
      <ScanDialog />
      <TagManager />
    </div>
  );
}
