import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { useUiStore } from "../store/uiStore";
import { useBookStore } from "../store/bookStore";
import type { ScanProgress } from "../api/scan";

export function ScanDialog() {
  const { showScanDialog, setShowScanDialog } = useUiStore();
  const { scanDirectory } = useBookStore();
  const [selectedPath, setSelectedPath] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!showScanDialog) {
      setProgress(null);
      setResult(null);
      setScanning(false);
      setSelectedPath("");
    }
  }, [showScanDialog]);

  useEffect(() => {
    const unlisten = listen<ScanProgress>("scan-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleSelectDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择电子书目录",
      });
      if (selected) {
        setSelectedPath(selected as string);
      }
    } catch (e) {
      console.error("Failed to select directory:", e);
    }
  };

  const handleScan = async () => {
    if (!selectedPath) return;
    setScanning(true);
    setResult(null);
    try {
      const report = await scanDirectory(selectedPath);
      setResult(
        `扫描完成！共 ${report.total} 个文件，新增 ${report.added} 本，更新 ${report.updated} 本${
          report.errors.length > 0
            ? `，${report.errors.length} 个错误`
            : ""
        }`
      );
    } catch (e) {
      setResult(`扫描失败：${e}`);
    } finally {
      setScanning(false);
    }
  };

  if (!showScanDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bookshelf-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bookshelf-text">扫描目录</h2>
          <button
            onClick={() => setShowScanDialog(false)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
           <p className="text-sm text-bookshelf-text-secondary">
             选择一个包含 EPUB/PDF 文件的目录进行扫描，以文件名为书名建立索引。
           </p>

          {/* 目录选择 */}
          <div>
            <label className="block text-xs font-medium text-bookshelf-text-secondary mb-1">
              目录路径
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedPath}
                readOnly
                placeholder="点击右侧按钮选择..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-bookshelf-border bg-gray-50"
              />
              <button
                onClick={handleSelectDir}
                disabled={scanning}
                className="px-4 py-2 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                选择
              </button>
            </div>
          </div>

          {/* 进度 */}
          {progress && (
            <div>
              <div className="flex justify-between text-xs text-bookshelf-text-secondary mb-1">
                <span>正在处理: {progress.current_file}</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-bookshelf-accent h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      progress.total > 0
                        ? (progress.current / progress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div
              className={`text-sm p-3 rounded-lg ${
                result.includes("失败")
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {result}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bookshelf-border flex justify-end gap-2">
          <button
            onClick={() => setShowScanDialog(false)}
            className="px-4 py-2 text-sm border border-bookshelf-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleScan}
            disabled={!selectedPath || scanning}
            className="px-4 py-2 text-sm bg-bookshelf-accent text-white rounded-lg hover:bg-bookshelf-accent-hover transition-colors disabled:opacity-50"
          >
            {scanning ? "扫描中..." : "开始扫描"}
          </button>
        </div>
      </div>
    </div>
  );
}
