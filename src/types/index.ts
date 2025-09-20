// Prompt 类型
export interface Prompt {
  id: number;
  title: string;
  description: string;
  created_at?: string; // 如果后端有时间字段
  updated_at?: string;
}

// 分页返回类型
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// 通用 API 响应（可选，如果你后端统一包一层 code/message）
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
