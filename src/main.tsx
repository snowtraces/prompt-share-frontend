import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./router";

import "./index.css";

const queryClient = new QueryClient();

// 添加主题监听
const ThemeHandler: React.FC = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // 初始化主题
    updateTheme(mediaQuery);
    
    // 监听系统主题变化
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  return null;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeHandler />
    <QueryClientProvider client={queryClient}>
      <AppRouter /> {/* 直接使用 AppRouter，移除 BrowserRouter 包裹 */}
    </QueryClientProvider>
  </React.StrictMode>
);