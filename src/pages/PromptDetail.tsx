// src/pages/PromptDetail.tsx
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import api, { PREVIEW_URL, THUMBNAIL_URL } from "../api";
import i18n from '../i18n';
import type { ApiResponse } from "../types";

interface Prompt {
    id: number;
    title: string;
    title_en?: string;
    content: string;
    content_en?: string;
    tags?: string;
    tags_en?: string;
    author_name?: string;
    like_count?: number;
    fav_count?: number;
    created_at?: string;
    source_url?: string;
    source_by?: string;
    source_tags?: string;
    images?: PromptImage[];
}

interface PromptImage {
    id?: number;
    prompt_id: number;
    file_id: number;
    tags: string;
    file_url?: string;
}

const PromptDetail: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrompt = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/prompts/${id}`);
                const data = res.data as ApiResponse<Prompt>;
                setPrompt(data.data);
            } catch (error) {
                console.error("获取提示词详情失败:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPrompt();
        }
    }, [id]);

    const handleCopyContent = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const renderTags = (prompt: Prompt) => {
        const tagsString = i18n.language === 'zh' ? prompt.tags : (prompt.tags_en || prompt.tags);
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

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>{t("loading")}</Typography>
            </Box>
        );
    }

    if (!prompt) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>{t("noResults")}</Typography>
                <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    {t("backToHome")}
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, maxWidth: 'md', mx: 'auto', width: '100%' }}>
            <Helmet>
                <title>{i18n.language === 'zh' ? prompt.title : (prompt.title_en || prompt.title)}</title>
                <meta
                    name="description"
                    content={
                        i18n.language === 'zh' ?
                            prompt.content.substring(0, 160) :
                            (prompt.content_en || prompt.content).substring(0, 160)
                    }
                />
                <meta
                    name="keywords"
                    content={(i18n.language === 'zh' ? prompt.tags : (prompt.tags_en || prompt.tags)) || ''}
                />
            </Helmet>


            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.6 }}>
                    {i18n.language === 'zh' ? prompt.title : (prompt.title_en || prompt.title)}
                </Typography>
                <IconButton onClick={() => navigate('/')} size="large">
                    <ArrowBackIcon  />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {renderTags(prompt)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
                    {prompt.author_name && (
                        <Typography variant="caption" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                            {t("author")}: {prompt.author_name}
                        </Typography>
                    )}
                    {prompt.source_by && (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {t("source")}: {prompt.source_url ?
                                <a href={prompt.source_url} target="_blank" rel="noopener noreferrer">{prompt.source_by} {prompt.source_tags && '(' + prompt.source_tags + ')'}</a>
                                : <span>{prompt.source_by} {prompt.source_tags && '(' + prompt.source_tags + ')'}</span>
                            }
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ position: 'relative', mb: 3 }}>
                <Typography
                    variant="body1"
                    paragraph
                    sx={{
                        whiteSpace: 'pre-wrap',
                        backgroundColor: 'action.hover',
                        p: 2,
                        borderRadius: 1,
                        fontSize: '1rem'
                    }}
                >
                    {i18n.language === 'zh' ? prompt.content : (prompt.content_en || prompt.content)}
                </Typography>
                <IconButton
                    aria-label={t("copy")}
                    onClick={() => handleCopyContent(i18n.language === 'zh' ? prompt.content : (prompt.content_en || prompt.content))}
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

            {prompt.images && prompt.images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>{t("effectImages")}</Typography>
                    <Grid container spacing={2}>
                        {prompt.images.map(img => (
                            <Grid size={{ xs: 12, sm: 4, md: 3 }} key={img.id}>
                                <Card sx={{ position: 'relative' }}>
                                    {img.file_url ? (
                                        <>
                                            <img
                                                src={THUMBNAIL_URL + img.file_id}
                                                alt={img.tags || "Prompt image"}
                                                style={{
                                                    height: 120,
                                                    width: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />

                                            <CardContent sx={{ p: 0.5, pb: '4px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" noWrap sx={{ pb: 0 }}>{img.tags}</Typography>
                                                <IconButton
                                                    sx={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        color: '#fff',
                                                        '&:hover': { background: 'rgba(0,0,0,0.6)' },
                                                        zIndex: 2
                                                    }}
                                                    size="small"
                                                    onClick={() => setPreviewImgUrl(PREVIEW_URL + img.file_id)}
                                                    aria-label={t("preview")}
                                                >
                                                    <ZoomInIcon fontSize="small" />
                                                </IconButton>
                                            </CardContent>
                                        </>
                                    ) : (
                                        <CardContent>
                                            <Typography variant="caption">{img.tags}</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {t("imageURLNotProvided")}
                                            </Typography>
                                        </CardContent>
                                    )}
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
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

            {/* 大图预览弹窗 */}
            {previewImgUrl && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        bgcolor: 'rgba(0,0,0,0.9)',
                        zIndex: 1300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setPreviewImgUrl(null)}
                >
                    <IconButton
                        onClick={() => setPreviewImgUrl(null)}
                        sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 1301 }}
                        aria-label={t("close")}
                    >
                        <CloseIcon />
                    </IconButton>
                    <img
                        src={previewImgUrl}
                        alt={t("imagePreview")}
                        style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Box>
            )}
        </Box>
    );
};

export default PromptDetail;