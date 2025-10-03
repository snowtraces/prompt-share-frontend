import { AppBar, Box, Button, CssBaseline, IconButton, ThemeProvider, Toolbar, Typography, useMediaQuery } from "@mui/material";

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import ForumIcon from '@mui/icons-material/Forum';
import FolderIcon from '@mui/icons-material/Folder';
import MenuIcon from '@mui/icons-material/Menu';
import React, { useState } from "react";
import { Outlet, Link as RouterLink, useNavigate } from "react-router-dom";
import MuiCssVars from "../theme/MuiCssVars";
import { darkTheme, lightTheme } from "../theme/theme";


interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const [iconOnly, setIconOnly] = useState<boolean | null>(() => {
    const savedPreference = localStorage.getItem("iconOnlyNav");
    return savedPreference ? JSON.parse(savedPreference) : null;
  });

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

  const toggleNavMode = () => {
    // 如果当前是图标模式，则切换到完整模式，反之亦然
    const currentlyIconOnly = iconOnly !== null ? iconOnly : isSmallScreen;
    const newIconOnly = !currentlyIconOnly;
    setIconOnly(newIconOnly);
    localStorage.setItem("iconOnlyNav", JSON.stringify(newIconOnly));
  };

  // 统一的菜单项样式
  const menuItemStyle = {
    justifyContent: 'flex-start',
    mb: 1,
    py: 1.5,
    px: 2,
    borderRadius: 1,
    fontWeight: 500,
    fontSize: '0.95rem'
  };

  // 仅图标模式的菜单项样式
  const iconOnlyMenuItemStyle = {
    justifyContent: 'center',
    mb: 1,
    py: 1.5,
    px: 0,
    borderRadius: 1,
    minWidth: 'auto',
    width: '100%'
  };

  // 决定是否只显示图标（用户设置优先，如果没有设置则根据屏幕尺寸决定）
  const showIconOnly = iconOnly !== null ? iconOnly : isSmallScreen;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MuiCssVars theme={theme} />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* 左侧导航栏 */}
        <AppBar position="static" color="primary" sx={{ 
          boxShadow: 'none', 
          width: showIconOnly ? 70 : 240,
          flexShrink: 0 
        }}>
          <Toolbar sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'stretch',
            height: '100%',
            padding: '8px 0 !important'
          }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: showIconOnly ? 'center' : 'space-between',
                mb: 2,
                mt: 1,
                px: showIconOnly ? 0 : 1
              }}
            >
              {!showIconOnly && (
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
                    style={{ height: '32px', marginRight: '8px' }}
                  />
                  <Typography variant="h6" component="div">
                    Prompt Share
                  </Typography>
                </Box>
              )}
              
              <IconButton
                onClick={toggleNavMode}
                color="inherit"
                sx={{ 
                  ...(showIconOnly && { 
                    margin: '0 auto' 
                  })
                }}
                aria-label={showIconOnly ? "展开菜单" : "收起菜单"}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              flexGrow: 1 
            }}>
              {showIconOnly ? (
                <>
                  <IconButton
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    sx={iconOnlyMenuItemStyle}
                    aria-label="首页"
                  >
                    <HomeIcon />
                  </IconButton>
                  {token && (
                    <>
                      <IconButton
                        component={RouterLink}
                        to="/prompts"
                        color="inherit"
                        sx={iconOnlyMenuItemStyle}
                        aria-label="提示词"
                      >
                        <ForumIcon />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to="/files"
                        color="inherit"
                        sx={iconOnlyMenuItemStyle}
                        aria-label="文件管理"
                      >
                        <FolderIcon />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    startIcon={<HomeIcon />}
                    sx={menuItemStyle}
                  >
                    首页
                  </Button>
                  {token && (
                    <>
                      <Button
                        component={RouterLink}
                        to="/prompts"
                        color="inherit"
                        startIcon={<ForumIcon />}
                        sx={menuItemStyle}
                      >
                        提示词
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/files"
                        color="inherit"
                        startIcon={<FolderIcon />}
                        sx={menuItemStyle}
                      >
                        文件管理
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              {showIconOnly ? (
                <>
                  <IconButton
                    onClick={handleThemeChange}
                    color="inherit"
                    sx={iconOnlyMenuItemStyle}
                    aria-label={mode === "light" ? '暗色主题' : '亮色主题'}
                  >
                    {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                  </IconButton>
                  {!token ? (
                    <IconButton
                      component={RouterLink}
                      to="/login"
                      color="inherit"
                      sx={iconOnlyMenuItemStyle}
                      aria-label="登录"
                    >
                      <LoginIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      color="inherit"
                      sx={iconOnlyMenuItemStyle}
                      aria-label="登出"
                      onClick={handleLogout}
                    >
                      <LogoutIcon />
                    </IconButton>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleThemeChange}
                    color="inherit"
                    startIcon={mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                    sx={menuItemStyle}
                  >
                    {mode === "light" ? '暗色主题' : '亮色主题'}
                  </Button>
                  {!token ? (
                    <Button
                      component={RouterLink}
                      to="/login"
                      color="inherit"
                      startIcon={<LoginIcon />}
                      sx={menuItemStyle}
                    >
                      登录
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={menuItemStyle}
                    >
                      登出
                    </Button>
                  )}
                </>
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
            display: 'flex',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '0',
            maxHeight: '100vh'
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