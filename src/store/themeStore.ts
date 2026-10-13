import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";
type Resolved = "light" | "dark";

const STORAGE_KEY = "bookshelf-theme";
const ORDER: ThemeMode[] = ["system", "light", "dark"];

/** 读取持久化的主题偏好，默认跟随系统 */
function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage 不可用时回退到默认 */
  }
  return "system";
}

/** 通过 matchMedia 读取浏览器/系统的浅色或深色偏好 */
function getSystemTheme(): Resolved {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

/** 将解析后的主题写入 <html>，驱动 Tailwind 的 dark: 变体 */
function applyTheme(resolved: Resolved) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }
}

function resolve(mode: ThemeMode, system: Resolved): Resolved {
  return mode === "system" ? system : mode;
}

interface ThemeState {
  mode: ThemeMode;
  systemTheme: Resolved;
  resolved: Resolved;
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
  _setSystem: (s: Resolved) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const mode = readMode();
  const systemTheme = getSystemTheme();
  const resolved = resolve(mode, systemTheme);
  applyTheme(resolved);

  return {
    mode,
    systemTheme,
    resolved,
    setMode: (m) => {
      try {
        localStorage.setItem(STORAGE_KEY, m);
      } catch {
        /* 忽略写入失败 */
      }
      const sys = get().systemTheme;
      const r = resolve(m, sys);
      applyTheme(r);
      set({ mode: m, resolved: r });
    },
    cycle: () => {
      const next = ORDER[(ORDER.indexOf(get().mode) + 1) % ORDER.length];
      get().setMode(next);
    },
    _setSystem: (s) => {
      const cur = get();
      const r = cur.mode === "system" ? s : cur.resolved;
      applyTheme(r);
      set({ systemTheme: s, resolved: r });
    },
  };
});

let initialized = false;

/**
 * 初始化系统外观监听：优先使用 Tauri 窗口主题（macOS 系统设置），
 * 不可用时回退到 matchMedia。只需在应用入口调用一次。
 */
export function initTheme() {
  if (initialized) return;
  initialized = true;

  // Tauri v2 窗口主题（跟随 macOS 系统外观）
  (async () => {
    try {
      const mod = await import("@tauri-apps/api/window");
      const win = mod.getCurrentWindow();
      const t = await win.theme();
      if (t === "light" || t === "dark") useThemeStore.getState()._setSystem(t);
      await win.onThemeChanged((e) => {
        if (e.payload === "light" || e.payload === "dark") {
          useThemeStore.getState()._setSystem(e.payload);
        }
      });
    } catch {
      /* 非 Tauri 环境（如浏览器 dev）忽略，使用 matchMedia 监听 */
    }
  })();

  // matchMedia 监听（浏览器 dev 与 Tauri 之外的兜底）
  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      useThemeStore.getState()._setSystem(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", handler);
  }
}
