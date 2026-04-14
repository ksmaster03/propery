import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { useTranslation } from '../../../lib/i18n';

// Tab แสดงหมวดหมู่ + สถิติ articles/skills ในแต่ละหมวด
export default function CategoriesTab() {
  const { locale } = useTranslation();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data } = await api.get('/kb/categories');
      return data.data;
    },
  });

  if (isLoading) return <LinearProgress />;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
      {categories.map((c: any) => (
        <Paper
          key={c.id}
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid rgba(22,63,107,.12)',
            borderTop: `4px solid ${c.color || '#005b9f'}`,
            transition: 'all .2s',
            '&:hover': { boxShadow: '0 4px 20px rgba(10,22,40,.1)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: (c.color || '#005b9f') + '22',
              }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 24, color: c.color || '#005b9f' }}>
                {c.icon || 'category'}
              </span>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{c.name_th}</Typography>
              <Typography sx={{ fontSize: 10, color: '#8a9cb2' }}>{c.name_en}</Typography>
            </Box>
          </Box>
          {c.description && (
            <Typography sx={{ fontSize: 11, color: '#5a6d80', mb: 1 }}>{c.description}</Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(22,63,107,.08)' }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: c.color || '#005b9f', fontFamily: "'IBM Plex Mono', monospace" }}>
                {c.skills_count || 0}
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#8a9cb2' }}>
                {locale === 'th' ? 'ทักษะ' : 'Skills'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: c.color || '#005b9f', fontFamily: "'IBM Plex Mono', monospace" }}>
                {c.articles_count || 0}
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#8a9cb2' }}>
                {locale === 'th' ? 'บทความ' : 'Articles'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
