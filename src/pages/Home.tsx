import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from "@mui/icons-material/Search";
import ZoomInIcon from '@mui/icons-material/ZoomIn'; // 新增
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  colors,
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
import api, { PREVIEW_URL, THUMBNAIL_URL } from "../api";
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
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);
  const cancelTokenRef = useRef<any>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const prevSearchTermRef = useRef<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // 状态管理
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 新增：大图弹窗状态
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
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
          paddingBottom: 2,
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
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 3,
                      padding: 0,
                    }}
                  >
                    {/* 背景图片 */}
                    {prompt.images && prompt.images.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${THUMBNAIL_URL}${prompt.images[0].file_id})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          opacity: 1,
                          zIndex: 0,
                          maskImage: 'linear-gradient(to left bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)',
                        }}
                      />
                    )}

                    <CardContent
                      sx={{
                        flexGrow: 1,
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 0,
                        '&:last-child': {
                          pb: 0,
                        },
                      }}
                    >

                      {/* 新增信息显示 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 16, px: 2 }}>
                        {prompt.tags && renderTags(prompt.tags)}

                        {/* 统一行显示点赞、收藏和按钮 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {prompt.like_count !== undefined && (
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                👍 {prompt.like_count}
                              </Typography>
                            )}
                            {prompt.fav_count !== undefined && (
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                💖 {prompt.fav_count}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ flexGrow: 1 }} />

                        </Box>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        px: 2,
                        mt: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                      }}>
                        <Typography
                          variant="h6"
                          component="h3"
                          gutterBottom
                          sx={{
                            fontWeight: 600,
                            lineHeight: 1.3,
                            mb: 0,
                            flex: 1,
                            py: 1,
                          }}
                        >
                          {prompt.title}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(prompt);
                          }}
                          sx={{
                            minWidth: 'auto',
                            padding: '0px 8px',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            borderRadius: 0.85,
                            visibility: 'hidden',
                            '.MuiCard-root:hover &': {
                              visibility: 'visible',
                            },
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            },
                            flexShrink: 0,
                            alignSelf: 'flex-start',
                            mt: 1,
                          }}
                        >
                          查看
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
        )
        }
      </Box >

      {/* 弹窗组件 */}
      < Dialog
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

        <DialogContent dividers sx={{ p: 2 }}>
          {selectedPrompt && (
            <Box sx={{ py: 0.5 }}>
              {/* 标题独占一行 */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                {selectedPrompt.title}
              </Typography>

              {/* tags 左侧，作者/来源右侧，全部同一行展示 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {selectedPrompt.tags && renderTags(selectedPrompt.tags)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
                  {selectedPrompt.author_name && (
                    <Typography variant="caption" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                      作者: {selectedPrompt.author_name}
                    </Typography>
                  )}
                  {selectedPrompt.source_by && (
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      来源: {selectedPrompt.source_url ?
                        <a href={selectedPrompt.source_url} target="_blank" rel="noopener noreferrer">{selectedPrompt.source_by} {selectedPrompt.source_tags && '(' + selectedPrompt.source_tags + ')'}</a>
                        : <span>{selectedPrompt.source_by} {selectedPrompt.source_tags && '(' + selectedPrompt.source_tags + ')'}</span>
                      }
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 主内容更紧凑 */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Typography
                  variant="body2"
                  paragraph
                  sx={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: 'action.hover',
                    p: 1.5,
                    borderRadius: 1,
                    fontSize: '0.98rem',
                    flex: 1,
                    mb: 0
                  }}
                >
                  {selectedPrompt.content}
                </Typography>
                {/* 悬浮复制按钮，适配深色模式 */}
                <IconButton
                  aria-label="复制内容"
                  onClick={() => handleCopyContent(selectedPrompt.content)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    background: theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : 'rgba(255,255,255,0.85)',
                    color: theme.palette.text.primary,
                    boxShadow: 1,
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? theme.palette.action.hover
                        : 'rgba(230,230,230,1)'
                    },
                    zIndex: 2
                  }}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* 相关图片更紧凑 */}
              {selectedPrompt.images && selectedPrompt.images.length > 0 && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 0.5 }}>效果图片</Typography>
                  <Grid container spacing={1}>
                    {selectedPrompt.images.map(img => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
                        <Card sx={{ position: 'relative' }}>
                          {img.file_url ? (
                            <>
                              <img
                                src={THUMBNAIL_URL + img.file_id}
                                alt={img.tags || "Prompt image"}
                                style={{
                                  height: 110,
                                  width: '100%',
                                  objectFit: 'cover',
                                  borderRadius: 3,
                                  display: 'block'
                                }}
                              />
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  right: 4,
                                  bottom: 4,
                                  background: 'rgba(0,0,0,0.4)',
                                  color: '#fff',
                                  '&:hover': { background: 'rgba(0,0,0,0.6)' },
                                  zIndex: 2
                                }}
                                size="small"
                                onClick={() => setPreviewImgUrl(PREVIEW_URL + img.file_id)}
                              >
                                <ZoomInIcon fontSize="small" />
                              </IconButton>
                              <CardContent sx={{ p: 0.5, pb: '4px !important' }}>
                                <Typography variant="caption" noWrap sx={{ pb: 0 }}>{img.tags}</Typography>
                              </CardContent>
                            </>
                          ) : (
                            <CardContent sx={{ p: 0.5 }}>
                              <Typography variant="caption">{img.tags}</Typography>
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

              {/* 点赞/收藏等操作，底部居中展示 */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
                {selectedPrompt.like_count !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    👍 {selectedPrompt.like_count}
                  </Typography>
                )}
                {selectedPrompt.fav_count !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    💖 {selectedPrompt.fav_count}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>关闭</Button>
        </DialogActions>
      </Dialog >

      {/* 大图预览弹窗 */}
      < Dialog
        open={!!previewImgUrl}
        onClose={() => setPreviewImgUrl(null)}
        maxWidth="lg"
      >
        <Box sx={{ position: 'relative', bgcolor: '#000' }}>
          <IconButton
            onClick={() => setPreviewImgUrl(null)}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          {previewImgUrl && (
            <img
              src={previewImgUrl}
              alt="大图预览"
              style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block', margin: '0' }}
            />
          )}
        </Box>
      </Dialog >
    </Box >
  );
};

export default Home;