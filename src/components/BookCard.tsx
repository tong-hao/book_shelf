import { open } from "@tauri-apps/plugin-shell";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { BookWithTags } from "../api/types";
import { useBookStore } from "../store/bookStore";
import { useUiStore } from "../store/uiStore";

interface Props {
  book: BookWithTags;
}

export function BookCard({ book }: Props) {
  const { selectedBookIds, handleBookClick, selectedBook } =
    useBookStore();
  const { multiSelect } = useUiStore();
  const isSelected = selectedBookIds.includes(book.id);
  const isActive = selectedBook?.id === book.id;

  const handleDoubleClick = async () => {
    try {
      await open(book.file_path);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  };

  const getInitial = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div
      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-bookshelf-card ${
        isSelected
          ? "border-bookshelf-accent shadow-md"
          : isActive
          ? "border-bookshelf-accent/50 shadow-sm"
          : "border-transparent hover:border-bookshelf-border hover:shadow-sm"
      }`}
      onClick={(e) => {
        handleBookClick(book);
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* 封面区域 */}
      <div className="aspect-[3/4] bg-gradient-to-br from-blue-50 to-gray-100 relative flex items-center justify-center overflow-hidden">
        {book.cover_path ? (
          <img
            key={book.cover_path}
            src={convertFileSrc(book.cover_path || '')}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 图片加载失败时显示占位
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const placeholder = document.createElement("div");
                placeholder.className = "text-4xl font-bold text-gray-400";
                placeholder.textContent = getInitial(book.title);
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <span className="text-4xl font-bold text-gray-400">
            {getInitial(book.title)}
          </span>
        )}

        {/* 已读标记 */}
        {book.is_read === 1 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            已读
          </div>
        )}

        {/* 评分 */}
        {book.rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {"★".repeat(book.rating)}
          </div>
        )}

        {/* 选中遮罩 */}
        {isSelected && (
          <div className="absolute inset-0 bg-bookshelf-accent/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-bookshelf-accent rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-bookshelf-text truncate" title={book.title}>
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-bookshelf-text-secondary truncate mt-0.5">
            {book.author}
          </p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          {book.format && (
            <span className="text-xs text-bookshelf-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">
              {book.format.toUpperCase()}
            </span>
          )}
          <span className="text-xs text-bookshelf-text-secondary">
            {formatFileSize(book.file_size)}
          </span>
        </div>
        {/* 标签 */}
        {book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {book.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 truncate max-w-[80px]"
              >
                {tag.name}
              </span>
            ))}
            {book.tags.length > 3 && (
              <span className="text-xs text-bookshelf-text-secondary">
                +{book.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右键菜单提示 */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
          {book.format?.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
