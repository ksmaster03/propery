import { Box, Paper, Typography, Chip, LinearProgress, ButtonGroup, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { useTranslation } from '../../../lib/i18n';

interface Props {
  categories: any[];
  activeCategory: number | null;
  onCategoryChange: (id: number | null) => void;
}

// Tab แสดงทักษะ — group ตามหมวด, แสดง proficiency bar + last used
export default function SkillsTab({ categories, activeCategory, onCategoryChange }: Props) {
  const { locale } = useTranslation();

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['kb-skills', activeCategory],
    queryFn: async () => {
      const params = activeCategory ? { categoryId: activeCategory } : {};
      const { data } = await api.get('/kb/skills', { params });
      return data.data;
    },
  });

  if (isLoading) return <LinearProgress />;

  const groupedByCategory: Record<string, any[]> = {};
  skills.forEach((s: any) => {
    const key = s.category_name || (locale === 'th' ? 'ไม่ระบุ' : 'Uncategorized');
    if (!groupedByCategory[key]) groupedByCategory[key] = [];
    groupedByCategory[key].push(s);
  });

  return (
    <Box>
      {/* Category filter chips */}
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
            label={`${c.name_th} (${c.skills_count})`}
            size="small"
            onClick={() => onCategoryChange(c.id)}
            sx={{
              fontSize: 11,
              bgcolor: activeCategory === c.id ? c.color : 'transparent',
              color: activeCategory === c.id ? '#fff' : c.color,
              border: `1px solid ${c.color}`,
              '&:hover': { bgcolor: c.color + '22' },
            }}
          />
        ))}
      </Box>

      {skills.length === 0 && (
        <Typography sx={{ fontSize: 13, color: '#5a6d80', textAlign: 'center', py: 4 }}>
          {locale === 'th' ? 'ยังไม่มีทักษะในหมวดนี้' : 'No skills yet'}
        </Typography>
      )}

      {Object.entries(groupedByCategory).map(([categoryName, categorySkills]) => (
        <Box key={categoryName} sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: '#163f6b' }}>
            {categoryName} ({categorySkills.length})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
            {categorySkills.map((s: any) => (
              <Paper
                key={s.id}
                elevation={0}
                sx={{
                  p: 1.75,
                  border: '1px solid rgba(22,63,107,.12)',
                  borderLeft: `3px solid ${s.category_color || '#005b9f'}`,
                  transition: 'all .2s',
                  '&:hover': { boxShadow: '0 2px 12px rgba(10,22,40,.08)' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{s.name}</Typography>
                  <Box sx={{ display: 'flex', gap: .25 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Box
                        key={n}
                        sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: n <= (s.proficiency || 0) ? (s.category_color || '#0f7a43') : '#e0e4ea',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                {s.description && (
                  <Typography sx={{ fontSize: 11, color: '#5a6d80', mt: .5, lineHeight: 1.4 }}>
                    {s.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1, fontSize: 10, color: '#8a9cb2' }}>
                  {s.last_used_at && (
                    <span>📅 {locale === 'th' ? 'ใช้ล่าสุด' : 'last used'}: {new Date(s.last_used_at).toLocaleDateString('th-TH')}</span>
                  )}
                  {s.use_count > 0 && <span>🔁 {s.use_count}×</span>}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
