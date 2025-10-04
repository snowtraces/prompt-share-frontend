import axios, { AxiosHeaders } from "axios";
import i18n from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000,
});

// 请求拦截器：自动加上 token 和语言头
api.interceptors.request.use((config) => {
  // 添加 token
  const token = localStorage.getItem("token");
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers = new AxiosHeaders({
        Authorization: `Bearer ${token}`
      });
    }
  }
  
  // 添加语言头
  const language = i18n.language || localStorage.getItem('i18nextLng') || 'en';
  if (config.headers) {
    config.headers['Accept-Language'] = language;
  } else {
    config.headers = new AxiosHeaders({
      'Accept-Language': language
    });
  }
  
  return config;
});

// 响应拦截器：捕获 401 错误并提示用户
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      alert("登录已过期，请重新登录。");
      // 可选：跳转到登录页
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
export const PREVIEW_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api") + "/files/preview/";
export const THUMBNAIL_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api") + "/files/thumbnail/";