import { useState } from "react";
import { useUiStore } from "../store/uiStore";
import { useBookStore } from "../store/bookStore";
import * as importApi from "../api/import";

const PLACEHOLDER = `三体,科幻,刘慈欣
百年孤独,文学,经典
银河帝国:基地,科幻,经典
活着,文学,余华`;

export function ImportPage() {
  const { setShowImportPage } = useUiStore();
  const loadBooks = useBookStore((s) => s.loadBooks);
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<importApi.CsvImportReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    const trimmed = csvText.trim();
    if (!trimmed) {
      setError("请输入 CSV 内容");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const report = await importApi.importBooksCsv(trimmed);
      setResult(report);
      // 刷新图书列表
      loadBooks();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowImportPage(false);
  };

  return (
    <div className="h-full flex flex-col bg-bookshelf-bg">
      {/* 顶部工具栏 */}
      <header className="bg-bookshelf-card/80 backdrop-blur-sm border-b border-bookshelf-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-bookshelf-text">导入图书标签</h1>
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">📖 CSV 格式说明</p>
            <p>每行代表一本图书，第一列为<strong>图书名称</strong>，后续列为<strong>标签名称</strong>。</p>
            <p className="mt-1">图书或标签不存在时会自动创建。支持双引号包裹含逗号的内容。</p>
          </div>

          {/* 输入框 */}
          <div>
            <label className="block text-sm font-medium text-bookshelf-text mb-2">
              粘贴 CSV 内容
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={12}
              className="w-full px-4 py-3 text-sm rounded-lg border border-bookshelf-border bg-white focus:outline-none focus:ring-2 focus:ring-bookshelf-accent focus:border-transparent font-mono resize-y"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-5 py-2 text-sm bg-bookshelf-accent text-white rounded-lg hover:bg-bookshelf-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  导入中...
                </>
              ) : (
                "导入"
              )}
            </button>
            <button
              onClick={() => setCsvText(PLACEHOLDER)}
              className="px-3 py-2 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-100 transition-colors text-bookshelf-text-secondary"
            >
              填入示例
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <p className="font-medium">导入失败</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* 导入结果 */}
          {result && (
            <div className={`rounded-lg p-4 text-sm ${
              result.errors.length > 0
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-green-50 border border-green-200"
            }`}>
              <p className={`font-medium mb-2 ${
                result.errors.length > 0 ? "text-yellow-800" : "text-green-800"
              }`}>
                {result.errors.length > 0 ? "导入完成（部分异常）" : "导入成功 ✅"}
              </p>
              <ul className="space-y-1 text-gray-700">
                <li>📄 总行数：<strong>{result.total_rows}</strong></li>
                <li>📚 新增图书：<strong>{result.books_created}</strong></li>
                <li>🔍 已有图书：<strong>{result.books_found}</strong></li>
                <li>🏷️ 新增标签：<strong>{result.tags_created}</strong></li>
                <li>🔗 标签关联：<strong>{result.tag_associations}</strong></li>
              </ul>
              {result.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="font-medium text-yellow-800 mb-1">异常信息：</p>
                  <ul className="space-y-0.5 text-red-600">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
