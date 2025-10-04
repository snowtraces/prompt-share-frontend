import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useTranslation } from "react-i18next";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { username, password });
      // 兼容后端返回格式
      if (res.data.code === 0 && res.data.data.token) {
        localStorage.setItem("token", res.data.data.token);
        navigate("/prompts");
      } else {
        setError(res.data.message || t("loginFailed"));
      }
    } catch (err) {
      setError(t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container maxWidth="xs" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 64px - 64px - 48px)' // 减去头部和底部高度
    }}>
      <Card sx={{ minWidth: 300 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {t("loginTitle")}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label={t("username")}
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
          />

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label={t("password")}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
          />

          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, mb: 1 }}
            onClick={handleLogin}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t("loginButton")}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;