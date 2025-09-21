import { createTheme } from "@mui/material/styles";

/**
 * Google 风格 Light 主题
 */
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1a73e8" }, // Google Blue
    secondary: { main: "#5f6368" }, // Google Gray
    success: { main: "#34a853" }, // Green
    warning: { main: "#fbbc04" }, // Yellow
    error: { main: "#ea4335" },   // Red
    info: { main: "#4285f4" },    // Blue
    background: {
      default: "#ffffff",
      paper: "#f8f9fa",
    },
    text: {
      primary: "#202124",
      secondary: "#5f6368",
    },
    divider: "#e0e0e0",
  },
});

/**
 * Google 风格 Dark 主题
 */
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8ab4f8" }, // Light Blue
    secondary: { main: "#9aa0a6" }, // Gray
    success: { main: "#81c995" },
    warning: { main: "#fdd663" },
    error: { main: "#f28b82" },
    info: { main: "#8ab4f8" },
    background: {
      default: "#202124",
      paper: "#303134",
    },
    text: {
      primary: "#e8eaed",
      secondary: "#9aa0a6",
    },
    divider: "#3c4043",
  },
});
