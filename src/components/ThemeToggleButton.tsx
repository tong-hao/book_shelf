import { useThemeStore, type ThemeMode } from "../store/themeStore";
import Tooltip from "./Tooltip";

const LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

/** 跟随系统：显示器图标 */
function SystemIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** 浅色：太阳图标 */
function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

/** 深色：月亮图标 */
function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
      />
    </svg>
  );
}

function IconFor({ mode }: { mode: ThemeMode }) {
  if (mode === "light") return <SunIcon />;
  if (mode === "dark") return <MoonIcon />;
  return <SystemIcon />;
}

export function ThemeToggleButton() {
  const mode = useThemeStore((s) => s.mode);
  const cycle = useThemeStore((s) => s.cycle);

  return (
    <Tooltip content={`主题：${LABELS[mode]}（点击切换）`}>
      <button
        onClick={cycle}
        aria-label="切换主题"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-bookshelf-text"
      >
        <IconFor mode={mode} />
      </button>
    </Tooltip>
  );
}
