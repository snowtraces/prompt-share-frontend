import axios, { AxiosHeaders } from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // 确认后端监听的地址
  timeout: 5000,
});


// 请求拦截器：自动加上 token
api.interceptors.request.use((config) => {
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
  return config;
});

export default api;
export const PREVIEW_URL = "http://localhost:8080/api/files/preview/";
export const THUMBNAIL_URL = "http://localhost:8080/api/files/thumbnail/";