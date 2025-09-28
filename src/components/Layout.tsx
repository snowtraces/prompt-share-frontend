import { AppBar, Box, Button, CssBaseline, IconButton, ThemeProvider, Toolbar, Typography } from "@mui/material";
import React, { useState } from "react";
import { Outlet, Link as RouterLink, useNavigate } from "react-router-dom";
import MuiCssVars from "../theme/MuiCssVars";
import { darkTheme, lightTheme } from "../theme/theme";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';


interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ }) => {
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
            <Box
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
              }}
            >
              <img
                src="/icon.png"
                alt="Prompt Share Logo"
                style={{ height: '40px', marginRight: '10px' }}
              />
              <Typography variant="h6" component="div">
                Prompt Share
              </Typography>
            </Box>

            <Box>
              <IconButton
                component={RouterLink}
                to="/"
                sx={{ mr: 2, color: 'inherit' }}
                aria-label="home"
              >
                <HomeIcon />
              </IconButton>
              {token && (
                <>
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
                </>
              )}
              <IconButton
                onClick={handleThemeChange}
                sx={{ mr: 2, color: 'inherit' }}
                aria-label="toggle theme"
              >
                {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
              {!token ? (
                <IconButton
                  component={RouterLink}
                  to="/login"
                  sx={{ color: 'inherit' }}
                  aria-label="login"
                >
                  <LoginIcon />
                </IconButton>
              ) : (
                <IconButton
                  sx={{ color: 'inherit' }}
                  aria-label="logout"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                </IconButton>
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
            maxHeight: 'calc(100vh - 64px)'
          }}
        >
          <Outlet /> {/* 用于渲染子路由内容 */}
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