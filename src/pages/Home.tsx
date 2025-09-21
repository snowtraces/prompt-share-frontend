import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import type { ApiResponse, PaginatedResponse } from "../types";

interface Prompt {
  id: number;
  title: string;
  content: string;
}

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const cancelTokenRef = useRef<any>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const prevSearchTermRef = useRef<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const PROMPTS_PER_PAGE = 9;

  // 获取提示词列表
  const fetchPrompts = useCallback(async (pageNum: number, searchQuery: string = "") => {
    // 如果搜索词发生变化，重置页码缓存
    if (searchQuery !== prevSearchTermRef.current) {
      requestedPagesRef.current.clear();
      prevSearchTermRef.current = searchQuery;
    }

    // 如果是分页加载且页面已请求过，则不重复请求
    if (requestedPagesRef.current.has(pageNum)) {
      return;
    }

    try {
      // 取消之前的请求
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }

      // 创建新的取消令牌（模拟）
      const cancelToken = {
        cancel: () => { },
        token: {}
      };
      cancelTokenRef.current = cancelToken;

      if (pageNum === 1) {
        setLoading(true);
        // 清空已请求页面记录（新搜索或刷新）
        requestedPagesRef.current.clear();
        requestedPagesRef.current.add(pageNum);
      } else {
        setLoadingMore(true);
        // 记录已请求的页面
        requestedPagesRef.current.add(pageNum);
      }

      const url = searchQuery
        ? `/prompts?page=${pageNum}&size=${PROMPTS_PER_PAGE}&q=${encodeURIComponent(searchQuery)}`
        : `/prompts?page=${pageNum}&size=${PROMPTS_PER_PAGE}`;

      const res = await api.get(url);
      const data = res.data as ApiResponse<PaginatedResponse<Prompt>>;
      const newPrompts = data.data.list;

      if (pageNum === 1) {
        setPrompts(newPrompts);
        setHasMore(newPrompts.length === PROMPTS_PER_PAGE);
      } else {
        setPrompts(prev => [...prev, ...newPrompts]);
        setHasMore(newPrompts.length === PROMPTS_PER_PAGE);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error: any) {
      if (error?.name !== 'CanceledError') {
        console.error("获取提示词失败:", error);
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // 初始加载和分页加载
  useEffect(() => {
    fetchPrompts(page, debouncedSearchTerm);
  }, [page, debouncedSearchTerm, fetchPrompts]);

  // 加载更多提示词
  const loadPrompts = useCallback(() => {
    if ((loading || loadingMore) || !hasMore) return;
    setPage(prev => prev + 1);
  }, [loading, loadingMore, hasMore]);

  // 搜索功能
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm); // 只有这里才更新
      setPage(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // 设置观察器监听占位节点
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadPrompts();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadPrompts]);

  return (
    <Box maxWidth="lg"
      sx={{
        p: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        overflowY: 'hidden'
      }}>
      {/* 固定搜索框 */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          my: 2,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'background.default',
          paddingTop: 2,
          paddingBottom: 2
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="搜索提示词..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* 提示词卡片列表 */}
      <Box sx={{ width: '100%', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">加载中...</Typography>
          </Box>
        ) : prompts.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {prompts.map((prompt) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4 }}
                  key={prompt.id}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'box-shadow 0.3s',
                      '&:hover': {
                        boxShadow: 4,
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {prompt.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {prompt.content}
                      </Typography>
                      <Box sx={{ mt: 'auto' }}>
                        <Button
                          component={Link}
                          to={`/prompts/${prompt.id}`}
                          variant="outlined"
                          size="small"
                          color="primary"
                        >
                          查看详情
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 占位节点 */}
            <div ref={sentinelRef} style={{ height: '20px', margin: '10px 0' }} />

            {loadingMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography color="text.secondary">加载中...</Typography>
              </Box>
            )}

            {!hasMore && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">没有更多内容了</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">没有找到相关提示词</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Home;