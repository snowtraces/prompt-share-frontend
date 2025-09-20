import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/auth/register", { username, password });
      alert("注册成功，请登录");
      navigate("/login");
    } catch (err) {
      alert("注册失败，用户名可能已存在");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-96 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">注册</h2>
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            注册
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-3">
          已有账号？
          <Link to="/login" className="text-blue-500 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
