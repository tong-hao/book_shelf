import type { BookWithTags } from "../api/types";
import { BookCard } from "./BookCard";
import { useBookStore } from "../store/bookStore";
import { useUiStore } from "../store/uiStore";
import { openBookFile } from "../api/books";

interface Props {
  books: BookWithTags[];
  isLoading: boolean;
}

export function BookGrid({ books, isLoading }: Props) {
  const { selectedBookIds, handleBookClick } = useBookStore();
  const { viewMode } = useUiStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-bookshelf-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-bookshelf-text-secondary">加载中...</span>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-bookshelf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-bookshelf-text">暂无图书</h3>
          <p className="mt-1 text-xs text-bookshelf-text-secondary">
            点击上方"扫描"按钮添加电子书
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-bookshelf-border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">书名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">作者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">格式</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">标签</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">评分</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-bookshelf-text-secondary uppercase tracking-wider">已读</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-bookshelf-border">
            {books.map((book) => {
              const isSelected = selectedBookIds.includes(book.id);
              return (
                <tr
                  key={book.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-bookshelf-accent/10 hover:bg-bookshelf-accent/15"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleBookClick(book)}
                  onDoubleClick={() => {
                    openBookFile(book.file_path).catch(console.error);
                  }}
                >
                  <td className="px-4 py-3 text-sm text-bookshelf-text">
                    {isSelected && (
                      <span className="mr-2 inline-block w-4 text-center">
                        {book.tags.length > 0 ? "✓" : "✓"}
                      </span>
                    )}
                    {book.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-bookshelf-text-secondary">{book.author || "-"}</td>
                  <td className="px-4 py-3 text-sm text-bookshelf-text-secondary">{book.format?.toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      {book.tags.slice(0, 2).map((t) => (
                        <span key={t.id} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{t.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{book.rating > 0 ? "★".repeat(book.rating) : "-"}</td>
                  <td className="px-4 py-3 text-sm">{book.is_read === 1 ? "✓" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 p-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
