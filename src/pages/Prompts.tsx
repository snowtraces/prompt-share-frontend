import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import type { ApiResponse, PaginatedResponse } from "../types";
// 引入 MUI 组件
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

// 更新 Prompt 接口以匹配实际数据结构
interface Prompt {
  id: number;
  title: string;
  content: string;
  tags?: string;
  user_id: number;
  author_name: string;
  like_count: number;
  fav_count: number;
  created_at: string;
  updated_at: string;
}

const Prompts: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 获取提示词列表
  const { data: prompts, isLoading, isError } = useQuery<ApiResponse<PaginatedResponse<Prompt>>>({
    queryKey: ["prompts", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/prompts?page=${page + 1}&size=${rowsPerPage}`);
      return res.data;
    },
  });

  // 删除提示词
  const deletePrompt = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });

  // 更新提示词
  const updatePrompt = useMutation({
    mutationFn: async () => {
      if (!editingPrompt) return;
      await api.put(`/prompts/${editingPrompt.id}`, { 
        title: editTitle, 
        content: editContent 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setEditingPrompt(null);
    },
  });

  const handleView = (prompt: Prompt) => {
    setViewingPrompt(prompt);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
  };

  const handleUpdate = () => {
    updatePrompt.mutate();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" my={4}>
      <CircularProgress />
    </Box>
  );

  if (isError) return (
    <Alert severity="error" sx={{ my: 2 }}>
      获取提示词列表失败
    </Alert>
  );

 return (
    <Box maxWidth="1200px" mx="auto" p={2} width={'100%'}>
      {/* 提示词表格 */}
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">
            提示词列表
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setEditingPrompt({} as Prompt);
              setEditTitle("");
              setEditContent("");
            }}
          >
            新增提示词
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="提示词表格">
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>标签</TableCell>
                <TableCell>作者</TableCell>
                <TableCell>点赞/收藏</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prompts?.data.list && prompts.data.list.length > 0 ? (
                prompts.data.list.map((prompt) => (
                  <TableRow
                    key={prompt.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {prompt.title}
                    </TableCell>
                    <TableCell>
                      {prompt.content.length > 50 
                        ? `${prompt.content.substring(0, 50)}...` 
                        : prompt.content}
                    </TableCell>
                    <TableCell>
                      {prompt.tags ? (
                        prompt.tags.split(',').map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag.trim()} 
                            size="small" 
                            sx={{ mr: 0.5 }} 
                          />
                        ))
                      ) : (
                        <Chip label="无标签" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{prompt.author_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prompt.like_count} / {prompt.fav_count}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        aria-label="查看" 
                        onClick={() => handleView(prompt)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        aria-label="编辑" 
                        onClick={() => handleEdit(prompt)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="删除"
                        onClick={() => deletePrompt.mutate(prompt.id)}
                        disabled={deletePrompt.isPending}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={prompts?.data.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} 共 ${count} 条`
          }
        />
      </Card>

      {/* 查看对话框 */}
      <Dialog 
        open={!!viewingPrompt} 
        onClose={() => setViewingPrompt(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>查看提示词</DialogTitle>
        <DialogContent>
          {viewingPrompt && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                标题: {viewingPrompt.title}
              </Typography>
              <Typography variant="body1" gutterBottom>
                内容: {viewingPrompt.content}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">详细信息:</Typography>
                <Typography variant="body2">
                  标签: {viewingPrompt.tags || '无'}
                </Typography>
                <Typography variant="body2">
                  作者: {viewingPrompt.author_name}
                </Typography>
                <Typography variant="body2">
                  点赞数: {viewingPrompt.like_count}
                </Typography>
                <Typography variant="body2">
                  收藏数: {viewingPrompt.fav_count}
                </Typography>
                <Typography variant="body2">
                  创建时间: {new Date(viewingPrompt.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  更新时间: {new Date(viewingPrompt.updated_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingPrompt(null)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 编辑/新增对话框 */}
      <Dialog 
        open={editingPrompt !== null} 
        onClose={() => setEditingPrompt(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingPrompt && editingPrompt.id ? "编辑提示词" : "新增提示词"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="标题"
            fullWidth
            variant="outlined"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="内容"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPrompt(null)}>取消</Button>
          <Button 
            onClick={handleUpdate} 
            disabled={updatePrompt.isPending || !editTitle}
            variant="contained"
          >
            {updatePrompt.isPending ? "保存中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Prompts;