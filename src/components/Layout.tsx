import { CssBaseline, ThemeProvider, AppBar, Toolbar, Typography, Button, Box, Container, IconButton } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import MuiCssVars from "../theme/MuiCssVars";
import { darkTheme, lightTheme } from "../theme/theme";
import React, { useState } from "react";

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

  const [mode, setMode] = useState<"light" | "dark">(() => {
    const savedMode = localStorage.getItem("themeMode");
    if (savedMode) {
      return savedMode === "dark" ? "dark" : "light";
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  });

  const theme = mode === "light" ? lightTheme : darkTheme;

  const handleThemeChange = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MuiCssVars theme={theme} />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* 顶部导航栏 */}
        <AppBar position="static" color="primary" sx={{ boxShadow: 'none' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold'
              }}
            >
              Prompt Share
            </Typography>

            <Box>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{ mr: 2 }}
              >
                首页
              </Button>
              <Button
                component={RouterLink}
                to="/prompts"
                color="inherit"
                sx={{ mr: 2 }}
              >
                提示词
              </Button>
              <Button
                component={RouterLink}
                to="/files"
                color="inherit"
                sx={{ mr: 2 }}
              >
                文件管理
              </Button>

              <Button
                variant="outlined"
                onClick={handleThemeChange}
                sx={{ mr: 2, color: 'inherit', borderColor: 'inherit' }}
              >
                切换到 {mode === "light" ? "Dark" : "Light"} 模式
              </Button>
              {!token ? (
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="secondary"
                >
                  登录
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleLogout}
                >
                  退出
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* 页面主体 */}
        <Box
          component="main"
          sx={{
            flex: 1,
            py: 3,
            bgcolor: 'background.default',
            width: '100% !important',
            display: 'flex',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '0',
            maxHeight: 'calc(100vh - 64px)' // 64px是顶部AppBar的高度，68px是底部footer的高度
          }}
        >
          {children}
        </Box>

        {/* 底部 */}
        {/* <Box
          component="footer"
          sx={{
            bgcolor: 'background.paper',
            py: 2,
            textAlign: 'center',
            mt: 'auto'
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="body2" color="text.secondary">
              © 2025 Prompt Share. All rights reserved.
            </Typography>
          </Container>
        </Box> */}
      </Box>
    </ThemeProvider>
  );
};

export default Layout;