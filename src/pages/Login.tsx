import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data.token;
      localStorage.setItem("token", token);
      setError("");
      navigate("/prompts");
    } catch (err) {
      setError("登录失败，请检查用户名或密码");
    }
  };

  return (
    // flex flex-col items-center justify-center flex-1 bg-gray-50
    <div className="flex items-center justify-center flex-1 bg-gray-50">
      <div className="bg-white shadow-md rounded p-8 w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">登录</h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="text"
          placeholder="用户名"
          className="border p-2 w-full mb-4 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="密码"
          className="border p-2 w-full mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600"
          onClick={handleLogin}
        >
          登录
        </button>
      </div>
    </div>
  );
};

export default Login;
