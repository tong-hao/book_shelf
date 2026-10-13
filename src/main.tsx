import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initTheme } from "./store/themeStore";
import "./index.css";

// 应用入口即初始化主题，确保首次渲染前 <html> 已带上正确的 dark class
initTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
