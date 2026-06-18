import { useState, useRef, useEffect, useCallback } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
}

export default function Tooltip({
  children,
  content,
  delay = 500,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          className="
            absolute z-50 px-2.5 py-1.5
            text-xs font-medium leading-tight text-white
            bg-gray-800/90 backdrop-blur-sm
            rounded-md shadow-lg
            whitespace-nowrap pointer-events-none
          "
          style={{
            top: "calc(100% + 7px)",
            left: "50%",
            transform: "translateX(-50%)",
            animation: "tooltip-fade-in 0.15s ease-out",
          }}
        >
          {content}
          {/* 小箭头（朝上） */}
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "4px solid rgba(31, 41, 55, 0.9)",
            }}
          />
        </div>
      )}
    </div>
  );
}
