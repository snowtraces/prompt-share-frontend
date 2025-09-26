// src/pages/Files.tsx
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Snackbar,
  Tooltip,
  Typography
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from "react";
import api, { PREVIEW_URL } from "../api";
import type { ApiResponse, PaginatedResponse } from "../types";
// 在文件顶部导入更多图标
import ArchiveIcon from '@mui/icons-material/Archive';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideocamIcon from '@mui/icons-material/Videocam';

interface LocalFile {
  id: number;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Files() {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [previewFile, setPreviewFile] = useState<LocalFile | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<any>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());

  const FILES_PER_PAGE = 9;

  // 获取文件列表
  const fetchFiles = useCallback(async (pageNum: number) => {
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

      const res = await api.get(`/files?page=${pageNum}&size=${FILES_PER_PAGE}`);
      const data = res.data as ApiResponse<PaginatedResponse<LocalFile>>;
      const newFiles = data.data.list;

      if (pageNum === 1) {
        setFiles(newFiles);
        setHasMore(newFiles.length === FILES_PER_PAGE);
      } else {
        setFiles(prev => [...prev, ...newFiles]);
        setHasMore(newFiles.length === FILES_PER_PAGE);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error: any) {
      if (error?.name !== 'CanceledError') {
        console.error("获取文件失败:", error);
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // 初始加载和分页加载
  useEffect(() => {
    fetchFiles(page);
  }, [page, fetchFiles]);

  // 加载更多文件
  const loadFiles = useCallback(() => {
    if ((loading || loadingMore) || !hasMore) return;
    setPage(prev => prev + 1);
  }, [loading, loadingMore, hasMore]);

  // 设置观察器监听占位节点
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadFiles();
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
  }, [hasMore, loadFiles]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/files/upload", formData);
    },
    onSuccess: () => {
      // 重新加载第一页数据
      setPage(1);
      setFile(null);
      setSnackbar({
        open: true,
        message: "文件上传成功",
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "文件上传失败",
        severity: 'error'
      });
    }
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件预览URL
  const getPreviewUrl = (f: LocalFile) => PREVIEW_URL + `${f.id}`;

  // 渲染预览内容
  const renderPreviewContent = (f: LocalFile) => {
    if (!f) return null;
    const url = getPreviewUrl(f);
    if (f.type.startsWith('image/')) {
      return <img src={url} alt={f.name} style={{ maxWidth: '100%', maxHeight: 500 }} />;
    }
    if (f.type === 'application/pdf') {
      return <iframe src={url} title={f.name} width="100%" height={500} style={{ border: 0 }} />;
    }
    if (f.type.startsWith('audio/')) {
      return <audio src={url} controls style={{ width: '100%' }} />;
    }
    if (f.type.startsWith('video/')) {
      return <video src={url} controls style={{ maxWidth: '100%', maxHeight: 500 }} />;
    }
    if (f.type.startsWith('text/') || f.type === 'application/json') {
      // 简单文本预览
      return (
        <iframe
          src={url}
          title={f.name}
          width="100%"
          height={400}
          style={{ border: 0, background: '#f5f5f5' }}
        />
      );
    }
    return <Typography color="textSecondary">暂不支持该类型文件预览</Typography>;
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 'lg' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          文件管理
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardHeader title="上传文件" />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
              >
                选择文件
                <VisuallyHiddenInput
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Button
                variant="contained"
                onClick={() => uploadMutation.mutate()}
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? <CircularProgress size={24} /> : '上传'}
              </Button>
              {file && (
                <Typography variant="body2" color="textSecondary">
                  已选择: {file.name}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : files.length > 0 ? (
          <>
            <Grid container spacing={2}>
              {files.map((f) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4 }}
                  key={f.id}>
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
                    <CardContent sx={{
                      flexGrow: 1,
                      pb: 1,
                      '&:last-child': {
                        pb: 1
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Tooltip title={f.name} placement="top-start">
                          <Typography
                            variant="subtitle1"
                            component="h3"
                            gutterBottom
                            noWrap
                            sx={{
                              fontWeight: 'medium',
                              flex: 1,
                              mr: 1
                            }}
                          >
                            {f.name}
                          </Typography>
                        </Tooltip>
                        <Box>
                          <Tooltip title="预览文件">
                            <IconButton
                              aria-label="preview"
                              size="small"
                              onClick={() => setPreviewFile(f)}
                            >
                              <InsertDriveFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="下载文件">
                            <IconButton
                              aria-label="download"
                              href={`/api/files/download/${f.id}`}
                              size="small"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Grid container spacing={0.5} sx={{ fontSize: '0.875rem' }}>
                        <Grid size={6}>
                          <Typography variant="body2" color="textSecondary">
                            标识: {f.id}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Tooltip title={f.type} placement="top-start">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {f.type.includes('image/') ? (
                                <ImageIcon fontSize="small" color="action" />
                              ) : f.type === 'application/pdf' ? (
                                <PictureAsPdfIcon fontSize="small" color="error" />
                              ) : f.type.includes('audio/') ? (
                                <AudiotrackIcon fontSize="small" color="info" />
                              ) : f.type.includes('video/') ? (
                                <VideocamIcon fontSize="small" color="secondary" />
                              ) : f.type.includes('text/') || f.type.includes('application/json') ? (
                                <DescriptionIcon fontSize="small" color="action" />
                              ) : f.type.includes('application/zip') || f.type.includes('application/x-') ? (
                                <ArchiveIcon fontSize="small" color="warning" />
                              ) : f.type.includes('text/html') || f.type.includes('text/css') || f.type.includes('application/javascript') ? (
                                <CodeIcon fontSize="small" color="action" />
                              ) : (
                                <InsertDriveFileIcon fontSize="small" color="action" />
                              )}
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                noWrap
                              >
                                [{f.type}]
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="body2" color="textSecondary">
                            大小: {formatFileSize(f.size)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="body2" color="textSecondary">
                            时间: {new Date(f.created_at).toLocaleDateString()} {new Date(f.created_at).toLocaleTimeString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 占位节点 */}
            <div ref={sentinelRef} style={{ height: '20px', margin: '10px 0' }} />

            {loadingMore && (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!hasMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography color="textSecondary" variant="body2">没有更多文件了</Typography>
              </Box>
            )}

            {/* 预览弹窗 */}
            <Dialog
              open={!!previewFile}
              onClose={() => setPreviewFile(null)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                文件预览：{previewFile?.name}
              </DialogTitle>
              <DialogContent dividers>
                {previewFile && renderPreviewContent(previewFile)}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Alert severity="info">暂无文件</Alert>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}