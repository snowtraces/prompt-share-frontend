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
import { useTranslation } from 'react-i18next';
import api, { PREVIEW_URL } from "../api";
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

// 添加图片相关类型和状态
interface PromptImage {
  id?: number;
  prompt_id: number;
  file_id: number;
  tags: string;
  file_url?: string; // 如果后端提供图片访问URL
}

const Prompts: React.FC = () => {
  const { t } = useTranslation();
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
  // 在现有状态声明后添加以下状态
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);

  // 添加新的状态来跟踪上传进度
  const [promptImages, setPromptImages] = useState<PromptImage[]>([]);
  const [newImages, setNewImages] = useState<Array<{ file: File, tags: string, previewUrl?: string }>>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Omit<Prompt, 'id'> & { id?: number }>({
    title: '',
    content: '',
    tags: '',
    source_url: '',
    source_by: '',
    source_tags: '',
    images: []
  });

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

  // 组件卸载时清理预览URL
  useEffect(() => {
    // 清理函数
    return () => {
      newImages.forEach(imgItem => {
        if (imgItem.previewUrl) {
          URL.revokeObjectURL(imgItem.previewUrl);
        }
      });
    };
  }, [newImages]);

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

  const handleOpenModal = async (prompt?: Prompt) => {
    if (prompt) {
      // 编辑模式
      setSelectedPrompt(prompt);
      setEditedPrompt({ ...prompt });
      setIsCreateMode(false);
      setPromptImages(prompt.images || []);
    } else {
      // 新增模式
      setSelectedPrompt(null);
      setEditedPrompt(null);
      setIsCreateMode(true);
      setNewPrompt({
        title: '',
        content: '',
        tags: '',
        source_url: '',
        source_by: '',
        source_tags: '',
        images: []
      });
      setPromptImages([]);
    }
    setIsModalOpen(true);
    // setIsEditing(true); // 默认进入编辑状态
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
    setEditedPrompt(null);
    setIsEditing(false);
    setIsCreateMode(false);
    setNewImages([]); // 清空上传的图片
  };

  // 添加创建提示词的处理函数
  const handleCreatePrompt = async () => {
    try {
      setUploadingImages(true);

      // 上传新图片并获取文件ID
      const uploadedImages: PromptImage[] = [];

      for (const imgItem of newImages) {
        try {
          // 上传单张图片到文件服务
          const formData = new FormData();
          formData.append('file', imgItem.file);

          const fileRes = await api.post('/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const fileId = fileRes.data.data.id;

          uploadedImages.push({
            "file_id": fileId,
            "tags": imgItem.tags,
            file_url: fileRes.data.data.path,
            prompt_id: 0 // 创建时还没有prompt_id
          });

        } catch (uploadError) {
          console.error("图片上传失败:", uploadError);
        }
      }

      // 创建提示词
      const promptData = {
        title: newPrompt.title,
        content: newPrompt.content,
        tags: newPrompt.tags,
        source_url: newPrompt.source_url,
        source_by: newPrompt.source_by,
        source_tags: newPrompt.source_tags
      };

      const res = await api.post('/prompts', promptData);
      const createdPrompt = res.data.data as Prompt;

      // 关联图片与提示词
      if (uploadedImages.length > 0) {
        const imagesWithPromptId = uploadedImages.map(img => ({
          ...img,
          prompt_id: createdPrompt.id
        }));

        await api.post(`/prompts/${createdPrompt.id}/images`, imagesWithPromptId);
        createdPrompt.images = imagesWithPromptId;
      }

      // 将新创建的提示词添加到列表顶部
      setPrompts(prev => [createdPrompt, ...prev]);

      // 关闭模态框并重置状态
      setIsModalOpen(false);
      setIsCreateMode(false);
      setNewImages([]);
      setUploadingImages(false);

      console.log("提示词创建成功");
    } catch (error) {
      console.error("创建失败:", error);
      setUploadingImages(false);
    }
  };


  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (isCreateMode) {
      handleCreatePrompt();
      return;
    }

    if (!editedPrompt) return;

    try {
      const imageRelations: PromptImage[] = [];

      // 逐张上传新图片
      if (newImages.length > 0) {
        setUploadingImages(true);

        // 逐个上传图片并获取文件ID
        for (const imgItem of newImages) {
          try {
            // 上传单张图片到文件服务
            const formData = new FormData();
            formData.append('file', imgItem.file);

            const fileRes = await api.post('/files/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            const fileId = fileRes.data.data.id; // 假设返回的文件ID在此路径

            imageRelations.push({
              "file_id": fileId,
              "tags": imgItem.tags,
              file_url: fileRes.data.data.path,
              prompt_id: editedPrompt.id
            });

          } catch (uploadError) {
            console.error("图片上传失败:", uploadError);
          }
        }

        // 更新图片列表状态
        setNewImages([]);
        setUploadingImages(false);

        if (imageRelations.length > 0) {
          imageRelations.forEach(relation => {
            relation.prompt_id = editedPrompt.id;
          });
        }
      }
      // 保存提示词信息（包括新增字段）
      await api.put(`/prompts/${editedPrompt.id}`, editedPrompt);
      const allImages = [...promptImages, ...imageRelations]
      if (allImages.length > 0) {
        await api.post(`/prompts/${editedPrompt.id}/images`, allImages);
      }
      setPromptImages(allImages);
      editedPrompt.images = allImages;

      // 更新本地状态
      setPrompts(prev => prev.map(p =>
        p.id === editedPrompt.id ? editedPrompt : p
      ));

      // 如果当前选中的也是这个prompt，也需要更新
      if (selectedPrompt && selectedPrompt.id === editedPrompt.id) {
        setSelectedPrompt({...editedPrompt});
      }

      setIsEditing(false);
      console.log("提示词保存成功");
    } catch (error) {
      console.error("保存失败:", error);
      setUploadingImages(false);
    }
  };
  const handlePromptChange = (field: keyof Prompt, value: string) => {
    if (isCreateMode) {
      setNewPrompt({
        ...newPrompt,
        [field]: value
      } as any);
    } else if (editedPrompt) {
      setEditedPrompt({
        ...editedPrompt,
        [field]: value
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => {
        // 创建预览URL
        const previewUrl = URL.createObjectURL(file);
        return {
          file,
          tags: '',
          previewUrl
        };
      });
      setNewImages(prev => [...prev, ...newFiles]);
    }
    // 清空input值，以便可以重复选择相同文件
    e.target.value = '';
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
          display: 'flex',
          gap: 2
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('searchPrompts')}
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
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenModal()}
        >
          {t('create')}
        </Button>
      </Box>

      {/* 提示词卡片列表 */}
      <Box sx={{ width: '100%', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">{t('loading')}</Typography>
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

                      {/* 新增信息显示 */}
                      {prompt.author_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {t('author')}: {prompt.author_name}
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
                          {t('view')}
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
                <Typography color="text.secondary">{t('loading')}</Typography>
              </Box>
            )}

            {!hasMore && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">{t('noMoreContent')}</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">{t('noResults')}</Typography>
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
            {isCreateMode ? t('upload') : isEditing ? t('editPrompt') : t('promptDetails')}
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedPrompt && (
            <Box sx={{ py: 2 }}>
              {isEditing ? (
                <>
                  <TextField
                    fullWidth
                    label={t('title')}
                    value={isCreateMode ? newPrompt?.title || '' : editedPrompt?.title || ''}
                    onChange={(e) => handlePromptChange('title', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label={t('content')}
                    value={isCreateMode ? newPrompt?.content || '' : editedPrompt?.content || ''}
                    onChange={(e) => handlePromptChange('content', e.target.value)}
                    margin="normal"
                    variant="outlined"
                    multiline
                    rows={4}
                  />

                  <TextField
                    fullWidth
                    label={t('tagsCommaSeparated')}
                    value={isCreateMode ? newPrompt?.tags || '' : editedPrompt?.tags || ''}
                    onChange={(e) => handlePromptChange('tags', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label={t('sourceURL')}
                    value={isCreateMode ? newPrompt?.source_url || '' : editedPrompt?.source_url || ''}
                    onChange={(e) => handlePromptChange('source_url', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label={t('sourceBy')}
                    value={isCreateMode ? newPrompt?.source_by || '' : editedPrompt?.source_by || ''}
                    onChange={(e) => handlePromptChange('source_by', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label={t('sourceTagsCommaSeparated')}
                    value={isCreateMode ? newPrompt?.source_tags || '' : editedPrompt?.source_tags || ''}
                    onChange={(e) => handlePromptChange('source_tags', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />

                  {/* 图片上传部分 */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>{t('relatedImages')}</Typography>

                    {/* 现有图片展示 - 仅在编辑模式下显示 */}
                    {!isCreateMode && promptImages.map((img, index) => (
                      <Box key={img.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          label={t('imageTags')}
                          value={img.tags}
                          onChange={(e) => {
                            const updatedImages = [...promptImages];
                            updatedImages[index].tags = e.target.value;
                            setPromptImages(updatedImages);
                          }}
                          size="small"
                          sx={{ mr: 1, flex: 1 }}
                        />
                        <IconButton
                          onClick={() => {
                            // 删除图片的逻辑
                            setPromptImages(promptImages.filter((_, i) => i !== index));
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ))}

                    {/* 新增图片上传 */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={uploadingImages}
                      >
                        {t('selectImages')}
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </Button>

                      {uploadingImages && (
                        <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                          {t('uploadingImages')}
                        </Typography>
                      )}
                    </Box>

                    {/* 新图片预览和标签输入 */}
                    {newImages.map((imgItem, index) => (
                      <Card key={`${index}-${imgItem.file.name}`} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <img
                                src={URL.createObjectURL(imgItem.file)}
                                alt="Preview"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '200px',
                                  objectFit: 'cover',
                                  marginBottom: '8px'
                                }}
                              />
                              <Typography variant="body2" noWrap>
                                {imgItem.file.name}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => {
                                setNewImages(newImages.filter((_, i) => i !== index));
                              }}
                              size="small"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                          <TextField
                            label={t('imageTags')}
                            value={imgItem.tags}
                            onChange={(e) => {
                              const updatedNewImages = [...newImages];
                              updatedNewImages[index].tags = e.target.value;
                              setNewImages(updatedNewImages);
                            }}
                            size="small"
                            fullWidth
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom>
                    {selectedPrompt?.title}
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
                    {selectedPrompt?.content}
                  </Typography>

                  {selectedPrompt?.tags && renderTags(selectedPrompt.tags)}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {selectedPrompt?.author_name && (
                      <Typography variant="body2" color="text.secondary">
                        {t('author')}: {selectedPrompt.author_name}
                      </Typography>
                    )}

                    {selectedPrompt?.like_count !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        👍 {selectedPrompt.like_count}
                      </Typography>
                    )}

                    {selectedPrompt?.fav_count !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        💖 {selectedPrompt.fav_count}
                      </Typography>
                    )}
                  </Box>

                  {selectedPrompt?.source_url && (
                    <Typography variant="body2" paragraph>
                      {t('sourceURL')}: <a href={selectedPrompt.source_url} target="_blank" rel="noopener noreferrer">{selectedPrompt.source_url}</a>
                    </Typography>
                  )}

                  {selectedPrompt?.source_by && (
                    <Typography variant="body2" paragraph>
                      {t('sourceBy')}: {selectedPrompt.source_by}
                    </Typography>
                  )}

                  {selectedPrompt?.source_tags && renderTags(selectedPrompt.source_tags)}

                  {/* 图片展示 */}
                  {promptImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>{t('relatedImages')}</Typography>
                      <Grid container spacing={2}>
                        {promptImages.map(img => (
                          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.file_id}>
                            <Card>
                              {img.file_url ? (
                                <>
                                  <img
                                    src={PREVIEW_URL + img.file_id}
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
                                    {t('imageURLNotProvided')}
                                  </Typography>
                                </CardContent>
                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>{t('close')}</Button>
          {isEditing ? (
            <>
              <Button onClick={handleEditToggle}>{t('cancel')}</Button>
              <Button
                onClick={handleSaveChanges}
                variant="contained"
                color="primary"
                disabled={uploadingImages}
              >
                {isCreateMode ? t('create') : t('saveChanges')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} variant="contained" color="primary">
                {t('edit')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Prompts;