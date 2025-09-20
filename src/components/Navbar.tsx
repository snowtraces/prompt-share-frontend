import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "用户";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b bg-white shadow">
      <h1 className="text-lg font-bold">Prompt Share</h1>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">{username}</span>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          退出
        </button>
      </div>
    </div>
  );
}
