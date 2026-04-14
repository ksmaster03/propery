import { Box, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { useTranslation } from '../../../lib/i18n';

interface Props {
  categories: any[];
  activeCategory: number | null;
  onCategoryChange: (id: number | null) => void;
}

// Tab แสดง bookmark — group ตามหมวด, favorite ขึ้นบนสุด
export default function BookmarksTab({ categories, activeCategory, onCategoryChange }: Props) {
  const { locale } = useTranslation();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['kb-bookmarks', activeCategory],
    queryFn: async () => {
      const params = activeCategory ? { categoryId: activeCategory } : {};
      const { data } = await api.get('/kb/bookmarks', { params });
      return data.data;
    },
  });

  if (isLoading) return <LinearProgress />;

  return (
    <Box>
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
            label={c.name_th}
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

      {bookmarks.length === 0 && (
        <Typography sx={{ fontSize: 13, color: '#5a6d80', textAlign: 'center', py: 4 }}>
          {locale === 'th' ? 'ยังไม่มี bookmark' : 'No bookmarks yet'}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
        {bookmarks.map((b: any) => (
          <Paper
            key={b.id}
            elevation={0}
            sx={{
              p: 1.75,
              border: '1px solid rgba(22,63,107,.12)',
              borderLeft: `3px solid ${b.category_color || '#005b9f'}`,
              transition: 'all .2s',
              '&:hover': { boxShadow: '0 2px 12px rgba(10,22,40,.08)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .5 }}>
                  {b.is_favorite && (
                    <span className="material-icons-outlined" style={{ fontSize: 16, color: '#d7a94b' }}>star</span>
                  )}
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#005b9f',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {b.title}
                  </a>
                  <span className="material-icons-outlined" style={{ fontSize: 14, color: '#8a9cb2' }}>open_in_new</span>
                </Box>
                {b.description && (
                  <Typography sx={{ fontSize: 11, color: '#5a6d80', lineHeight: 1.4, mb: .5 }}>
                    {b.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: .5, alignItems: 'center' }}>
                  {b.category_name && (
                    <Chip
                      label={b.category_name}
                      size="small"
                      sx={{
                        fontSize: 10, height: 18,
                        bgcolor: (b.category_color || '#005b9f') + '22',
                        color: b.category_color || '#005b9f',
                      }}
                    />
                  )}
                  <Typography sx={{ fontSize: 10, color: '#8a9cb2' }}>
                    {new URL(b.url).hostname}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
