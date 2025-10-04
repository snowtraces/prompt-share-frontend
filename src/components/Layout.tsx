import { AppBar, Box, Button, CssBaseline, IconButton, Menu, MenuItem, ThemeProvider, Toolbar, Typography, useMediaQuery } from "@mui/material";

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FolderIcon from '@mui/icons-material/Folder';
import ForumIcon from '@mui/icons-material/Forum';
import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useNavigate } from "react-router-dom";
import i18n from '../i18n';
import MuiCssVars from "../theme/MuiCssVars";
import { darkTheme, lightTheme } from "../theme/theme";


interface LayoutProps {
  children?: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ }) => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const [iconOnly, setIconOnly] = useState<boolean | null>(() => {
    const savedPreference = localStorage.getItem("iconOnlyNav");
    return savedPreference ? JSON.parse(savedPreference) : null;
  });

  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const openLanguageMenu = Boolean(languageAnchorEl);

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

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

 const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng).then(() => {
    localStorage.setItem('i18nextLng', lng); // 保存选择
  });
  handleLanguageClose();
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
                aria-label={showIconOnly ? t('expandMenu') : t('collapseMenu')}
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
                    aria-label={t('home')}
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
                        aria-label={t('prompts')}
                      >
                        <ForumIcon />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to="/files"
                        color="inherit"
                        sx={iconOnlyMenuItemStyle}
                        aria-label={t('files')}
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
                    {t('home')}
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
                        {t('prompts')}
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/files"
                        color="inherit"
                        startIcon={<FolderIcon />}
                        sx={menuItemStyle}
                      >
                        {t('files')}
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
                    onClick={handleLanguageClick}
                    color="inherit"
                    sx={iconOnlyMenuItemStyle}
                    aria-label="语言切换"
                  >
                    <LanguageIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleThemeChange}
                    color="inherit"
                    sx={iconOnlyMenuItemStyle}
                    aria-label={mode === "light" ? t('darkTheme') : t('lightTheme')}
                  >
                    {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                  </IconButton>
                  {!token ? (
                    <IconButton
                      component={RouterLink}
                      to="/login"
                      color="inherit"
                      sx={iconOnlyMenuItemStyle}
                      aria-label={t('login')}
                    >
                      <LoginIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      color="inherit"
                      sx={iconOnlyMenuItemStyle}
                      aria-label={t('logout')}
                      onClick={handleLogout}
                    >
                      <LogoutIcon />
                    </IconButton>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleLanguageClick}
                    color="inherit"
                    startIcon={<LanguageIcon />}
                    sx={menuItemStyle}
                  >
                    语言/Language
                  </Button>
                  <Button
                    onClick={handleThemeChange}
                    color="inherit"
                    startIcon={mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                    sx={menuItemStyle}
                  >
                    {mode === "light" ? t('darkTheme') : t('lightTheme')}
                  </Button>
                  {!token ? (
                    <Button
                      component={RouterLink}
                      to="/login"
                      color="inherit"
                      startIcon={<LoginIcon />}
                      sx={menuItemStyle}
                    >
                      {t('login')}
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={menuItemStyle}
                    >
                      {t('logout')}
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

        {/* 语言选择菜单 */}
        <Menu
          anchorEl={languageAnchorEl}
          open={openLanguageMenu}
          onClose={handleLanguageClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem
            onClick={() => changeLanguage('zh')}
            selected={i18n.language === 'zh' || i18n.language.startsWith('zh')}
          >
            中文
          </MenuItem>
          <MenuItem
            onClick={() => changeLanguage('en')}
            selected={i18n.language === 'en' || i18n.language.startsWith('en')}
          >
            English
          </MenuItem>
        </Menu>

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