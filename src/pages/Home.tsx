import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-50">
      <h1 className="text-4xl font-bold mb-6">欢迎来到 Prompt Share</h1>
      <p className="text-gray-700 mb-8">
        这是一个分享和管理提示词的社区。
      </p>

      <div className="space-x-4">
        <Link
          to="/login"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          登录
        </Link>
        <Link
          to="/prompts"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          查看提示词
        </Link>
      </div>
    </div>
  );
};

export default Home;