import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import api, { FILE_URL } from "../api";
import type { ApiResponse, PaginatedResponse } from "../types";

interface Prompt {
  id: number;
  title: string;
  content: string;
  tags?: string;
  author_name?: string;
  like_count?: number;
  fav_count?: number;
  created_at?: string;
  // 新增字段
  source_url?: string;
  source_by?: string;
  source_tags?: string;
  // 添加图片字段
  images?: PromptImage[]; // 添加此行
}

// 添加图片相关类型
interface PromptImage {
  id?: number;
  prompt_id: number;
  file_id: number;
  tags: string;
  file_url?: string;
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

  // 状态管理
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptImages, setPromptImages] = useState<PromptImage[]>([]);
  // 添加图片缓存状态
  const [promptImagesCache, setPromptImagesCache] = useState<Record<number, PromptImage[]>>({});



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

  // 获取单个提示词的图片
  const fetchPromptImages = useCallback(async (promptId: number) => {
    // 如果已缓存，直接返回
    if (promptImagesCache[promptId]) {
      return promptImagesCache[promptId];
    }

    try {
      const res = await api.get(`/prompts/${promptId}/images`);
      const images = res.data.data || [];

      // 更新缓存
      setPromptImagesCache(prev => ({
        ...prev,
        [promptId]: images
      }));

      return images;
    } catch (error) {
      console.error(`获取提示词 ${promptId} 的图片失败:`, error);
      return [];
    }
  }, [promptImagesCache]);

  // 在 useEffect 中加载图片数据
  useEffect(() => {
    // 当提示词列表更新时，为没有图片缓存的提示词加载第一张图片
    prompts.forEach(prompt => {
      if (!promptImagesCache[prompt.id]) {
        fetchPromptImages(prompt.id);
      }
    });
  }, [prompts, promptImagesCache, fetchPromptImages]);

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
      setDebouncedSearchTerm(searchTerm);
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

  // 处理标签显示
  const renderTags = (tagsString?: string) => {
    if (!tagsString) return null;
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            size="small"
            variant="outlined"
            sx={{ height: 20 }}
          />
        ))}
      </Box>
    );
  };

  const handleOpenModal = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);

    // 获取该提示词的相关图片
    try {
      const res = await api.get(`/prompts/${prompt.id}/images`);
      setPromptImages(res.data.data || []);
    } catch (error) {
      console.error("获取图片失败:", error);
      setPromptImages([]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

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
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* 背景图片 */}
                    {promptImagesCache[prompt.id] && promptImagesCache[prompt.id].length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100%',  // 增加宽度
                          height: '100%',
                          backgroundImage: `url(${FILE_URL}${promptImagesCache[prompt.id][0].file_id})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          opacity: 0.3,  // 稍微增加透明度
                          zIndex: 0,
                          // 添加渐变遮罩实现左边虚化淡入效果
                          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
                        }}
                      />
                    )}

                    <CardContent
                      sx={{
                        flexGrow: 1,
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
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

                      {/* 新增信息显示 */}
                      {prompt.author_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          作者: {prompt.author_name}
                        </Typography>
                      )}

                      {prompt.tags && renderTags(prompt.tags)}

                      {(prompt.like_count !== undefined || prompt.fav_count !== undefined) && (
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          {prompt.like_count !== undefined && (
                            <Typography variant="body2" color="text.secondary">
                              👍 {prompt.like_count}
                            </Typography>
                          )}
                          {prompt.fav_count !== undefined && (
                            <Typography variant="body2" color="text.secondary">
                              💖 {prompt.fav_count}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box sx={{ mt: 'auto', pt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleOpenModal(prompt)}
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

      {/* 弹窗组件 */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            提示词详情
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedPrompt && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h5" gutterBottom>
                {selectedPrompt.title}
              </Typography>

              <Typography
                variant="body1"
                paragraph
                sx={{
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'action.hover',
                  p: 2,
                  borderRadius: 1
                }}
              >
                {selectedPrompt.content}
              </Typography>

              {selectedPrompt.tags && renderTags(selectedPrompt.tags)}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {selectedPrompt.author_name && (
                  <Typography variant="body2" color="text.secondary">
                    作者: {selectedPrompt.author_name}
                  </Typography>
                )}

                {selectedPrompt.like_count !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    👍 {selectedPrompt.like_count}
                  </Typography>
                )}

                {selectedPrompt.fav_count !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    💖 {selectedPrompt.fav_count}
                  </Typography>
                )}
              </Box>

              {selectedPrompt.source_url && (
                <Typography variant="body2" paragraph>
                  来源地址: <a href={selectedPrompt.source_url} target="_blank" rel="noopener noreferrer">{selectedPrompt.source_url}</a>
                </Typography>
              )}

              {selectedPrompt.source_by && (
                <Typography variant="body2" paragraph>
                  来源人: {selectedPrompt.source_by}
                </Typography>
              )}

              {selectedPrompt.source_tags && renderTags(selectedPrompt.source_tags)}

              {/* 图片展示 */}
              {promptImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>相关图片</Typography>
                  <Grid container spacing={2}>
                    {promptImages.map(img => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
                        <Card>
                          {img.file_url ? (
                            <>
                              <img
                                src={FILE_URL + img.file_id}
                                alt={img.tags || "Prompt image"}
                                style={{ width: '100%', height: 'auto' }}
                              />
                              <CardContent>
                                <Typography variant="body2">{img.tags}</Typography>
                              </CardContent>
                            </>
                          ) : (
                            <CardContent>
                              <Typography variant="body2">{img.tags}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                图片URL未提供
                              </Typography>
                            </CardContent>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;