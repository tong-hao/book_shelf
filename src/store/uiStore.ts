import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  showScanDialog: boolean;
  showTagManager: boolean;
  viewMode: "grid" | "list";
  multiSelect: boolean;
  tagVersion: number;

  toggleSidebar: () => void;
  setShowScanDialog: (show: boolean) => void;
  setShowTagManager: (show: boolean) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setMultiSelect: (on: boolean) => void;
  bumpTagVersion: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  showScanDialog: false,
  showTagManager: false,
  viewMode: "grid",
  multiSelect: false,
  tagVersion: 0,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setShowScanDialog: (show) => set({ showScanDialog: show }),
  setShowTagManager: (show) => {
    if (!show) {
      set((state) => ({ showTagManager: show, tagVersion: state.tagVersion + 1 }));
    } else {
      set({ showTagManager: show });
    }
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setMultiSelect: (on) => {
    if (!on) {
      // 退出多选时清除所有选中
      set({ multiSelect: false });
      // 清除选中需要通知 bookStore → 通过事件或直接修改
      // 使用 uiStore 内部清除比较安全，bookStore 会同步
    } else {
      set({ multiSelect: on });
    }
  },
  bumpTagVersion: () => set((state) => ({ tagVersion: state.tagVersion + 1 })),
}));
