import { useState } from 'react';
import { Box, Paper, Typography, Chip, LinearProgress, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { useTranslation } from '../../../lib/i18n';

interface Props {
  categories: any[];
  activeCategory: number | null;
  onCategoryChange: (id: number | null) => void;
}

// Tab แสดงบทความ — list view + click เพื่อเปิด detail dialog
export default function ArticlesTab({ categories, activeCategory, onCategoryChange }: Props) {
  const { locale } = useTranslation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb-articles', activeCategory],
    queryFn: async () => {
      const params = activeCategory ? { categoryId: activeCategory } : {};
      const { data } = await api.get('/kb/articles', { params });
      return data.data;
    },
  });

  const { data: articleDetail } = useQuery({
    queryKey: ['kb-article', selectedSlug],
    queryFn: async () => {
      const { data } = await api.get(`/kb/articles/${selectedSlug}`);
      return data.data;
    },
    enabled: !!selectedSlug,
  });

  if (isLoading) return <LinearProgress />;

  return (
    <Box>
      {/* Category filter */}
      <Box sx={{ display: 'flex', gap: .75, flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={locale === 'th' ? 'ทั้งหมด' : 'All'}
          size="small"
          onClick={() => onCategoryChange(null)}
          color={activeCategory === null ? 'primary' : 'default'}
          sx={{ fontSize: 11 }}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={`${c.name_th} (${c.articles_count})`}
            size="small"
            onClick={() => onCategoryChange(c.id)}
            sx={{
              fontSize: 11,
              bgcolor: activeCategory === c.id ? c.color : 'transparent',
              color: activeCategory === c.id ? '#fff' : c.color,
              border: `1px solid ${c.color}`,
            }}
          />
        ))}
      </Box>

      {articles.length === 0 && (
        <Typography sx={{ fontSize: 13, color: '#5a6d80', textAlign: 'center', py: 4 }}>
          {locale === 'th' ? 'ยังไม่มีบทความ' : 'No articles yet'}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {articles.map((a: any) => (
          <Paper
            key={a.id}
            elevation={0}
            onClick={() => setSelectedSlug(a.slug)}
            sx={{
              p: 2,
              cursor: 'pointer',
              border: '1px solid rgba(22,63,107,.12)',
              borderLeft: `3px solid ${a.category_color || '#005b9f'}`,
              transition: 'all .2s',
              '&:hover': { boxShadow: '0 2px 12px rgba(10,22,40,.1)', borderColor: a.category_color || '#005b9f' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                  {a.is_pinned && (
                    <span className="material-icons-outlined" style={{ fontSize: 16, color: '#d7a94b' }}>push_pin</span>
                  )}
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{a.title}</Typography>
                </Box>
                {a.summary && (
                  <Typography sx={{ fontSize: 12, color: '#5a6d80', lineHeight: 1.5, mb: 1 }}>
                    {a.summary}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5, alignItems: 'center' }}>
                  {a.category_name && (
                    <Chip
                      label={a.category_name}
                      size="small"
                      sx={{ fontSize: 10, height: 20, bgcolor: (a.category_color || '#005b9f') + '22', color: a.category_color || '#005b9f' }}
                    />
                  )}
                  {(a.tags || []).map((t: string) => (
                    <Chip key={t} label={`#${t}`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                  ))}
                  <Box sx={{ flex: 1 }} />
                  <Typography sx={{ fontSize: 10, color: '#8a9cb2' }}>
                    {'⭐'.repeat(a.difficulty || 0)} · {a.read_time_min} {locale === 'th' ? 'นาที' : 'min'} · 👁 {a.view_count}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedSlug}
        onClose={() => setSelectedSlug(null)}
        maxWidth="md"
        fullWidth
      >
        {articleDetail && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{articleDetail.title}</Typography>
                <Box sx={{ display: 'flex', gap: .5, mt: .5 }}>
                  {(articleDetail.tags || []).map((t: string) => (
                    <Chip key={t} label={`#${t}`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                  ))}
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedSlug(null)} size="small">
                <span className="material-icons-outlined">close</span>
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {articleDetail.summary && (
                <Typography sx={{ fontSize: 13, color: '#5a6d80', mb: 2, fontStyle: 'italic' }}>
                  {articleDetail.summary}
                </Typography>
              )}
              <Box
                component="pre"
                sx={{
                  fontSize: 12,
                  fontFamily: "'IBM Plex Mono', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  bgcolor: '#f8fafc',
                  p: 2,
                  borderRadius: 1,
                  maxHeight: '60vh',
                  overflow: 'auto',
                }}
              >
                {articleDetail.content}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
