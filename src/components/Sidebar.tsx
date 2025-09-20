import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { to: "/files", label: "文件管理" },
    { to: "/prompts", label: "Prompt 管理" },
  ];

  return (
    <div className="w-48 bg-gray-100 h-screen border-r">
      <ul className="space-y-2 p-4">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${
                  isActive ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
