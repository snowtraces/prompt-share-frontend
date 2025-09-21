export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--mui-primary)",
        secondary: "var(--mui-secondary)",
        success: "var(--mui-success)",
        warning: "var(--mui-warning)",
        error: "var(--mui-error)",
        info: "var(--mui-info)",
        bg: "var(--mui-bg)",
        surface: "var(--mui-surface)",
        text: "var(--mui-text)",
        textSecondary: "var(--mui-text-secondary)",
      },
    },
  },
  plugins: [],
  darkMode: 'class', // 添加这行以支持暗色主题
};