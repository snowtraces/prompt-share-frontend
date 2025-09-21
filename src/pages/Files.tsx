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
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api";

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
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const { data, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const res = await api.get("/files");
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/files/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
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

  return (
    <Box sx={{ p: 2 }}>
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardHeader title="文件列表" />
          <CardContent>
            {data?.length === 0 ? (
              <Alert severity="info">暂无文件</Alert>
            ) : (
              <List>
                {data?.map((f: any) => (
                  <ListItem 
                    key={f.id} 
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                    divider
                  >
                    <ListItemText 
                      primary={f.filename} 
                      secondary={`ID: ${f.id}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="下载文件">
                        <IconButton 
                          edge="end" 
                          aria-label="download"
                          href={`/api/files/download/${f.id}`}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
      
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