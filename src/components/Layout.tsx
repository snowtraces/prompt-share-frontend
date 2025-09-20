import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Prompt Share
        </Link>

        <nav className="space-x-4">
          <Link to="/" className="hover:underline">
            首页
          </Link>
          <Link to="/prompts" className="hover:underline">
            提示词
          </Link>
          {!token ? (
            <Link to="/login" className="hover:underline">
              登录
            </Link>
          ) : (
            <button
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              onClick={handleLogout}
            >
              退出
            </button>
          )}
        </nav>
      </header>

      {/* 页面主体 */}
      <main className="flex-1 container mx-auto px-6 py-4 flex flex-col">{children}</main>

      {/* 底部 */}
      <footer className="bg-gray-200 text-center p-4 text-sm text-gray-600">
        © 2025 Prompt Share. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
