import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, TextField, Chip, Button, IconButton,
  LinearProgress, Alert, InputAdornment,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';
import SkillsTab from './tabs/SkillsTab';
import ArticlesTab from './tabs/ArticlesTab';
import BookmarksTab from './tabs/BookmarksTab';
import CategoriesTab from './tabs/CategoriesTab';

// หน้า Knowledge Base — แสดงทักษะ/บทความ/bookmark ที่เก็บใน kb database
// ใช้ tabs แยกแต่ละส่วน + global search bar ด้านบน
export default function KbPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Stats สำหรับ tab badge
  const { data: stats } = useQuery({
    queryKey: ['kb-stats'],
    queryFn: async () => {
      const { data } = await api.get('/kb/stats');
      return data.data;
    },
  });

  // Categories (shared across tabs for filtering)
  const { data: categories = [] } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data } = await api.get('/kb/categories');
      return data.data;
    },
  });

  // Global search — trigram similarity
  const { data: searchResults } = useQuery({
    queryKey: ['kb-search', search],
    queryFn: async () => {
      if (!search.trim()) return null;
      const { data } = await api.get('/kb/search', { params: { q: search } });
      return data.data;
    },
    enabled: search.length >= 2,
  });

  const tabs = useMemo(() => [
    { label: locale === 'th' ? 'ทักษะ' : 'Skills', icon: 'psychology', count: stats?.skills_count || 0 },
    { label: locale === 'th' ? 'บทความ' : 'Articles', icon: 'article', count: stats?.articles_count || 0 },
    { label: locale === 'th' ? 'Bookmark' : 'Bookmarks', icon: 'bookmark', count: stats?.bookmarks_count || 0 },
    { label: locale === 'th' ? 'หมวดหมู่' : 'Categories', icon: 'folder', count: stats?.categories_count || 0 },
  ], [stats, locale]);

  const showSearchResults = search.trim().length >= 2 && searchResults;

  return (
    <>
      <PageHeader
        icon="📚"
        title={locale === 'th' ? 'Knowledge Base' : 'Knowledge Base'}
        subtitle={locale === 'th' ? 'บันทึกทักษะ บทความ และ bookmark ในการพัฒนาระบบ' : 'Personal knowledge base for dev skills'}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: 'auto', p: 2.75, '&:focus-visible': { outline: '2px solid #005b9f', outlineOffset: -2 } }}>
        {/* Top bar: stats + search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          {/* KPI stats strip */}
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', flex: 1, minWidth: 300 }}>
            {[
              { label: locale === 'th' ? 'หมวด' : 'Categories', value: stats?.categories_count, color: '#005b9f', icon: 'folder' },
              { label: locale === 'th' ? 'ทักษะ' : 'Skills', value: stats?.skills_count, color: '#0f7a43', icon: 'psychology' },
              { label: locale === 'th' ? 'บทความ' : 'Articles', value: stats?.articles_count, color: '#7c3aed', icon: 'article' },
              { label: locale === 'th' ? 'Tags' : 'Tags', value: stats?.tags_count, color: '#d7a94b', icon: 'sell' },
              { label: locale === 'th' ? 'Bookmark' : 'Bookmarks', value: stats?.bookmarks_count, color: '#b52822', icon: 'bookmark' },
            ].map((s) => (
              <Paper
                key={s.label}
                elevation={0}
                sx={{
                  px: 1.75, py: 1.25,
                  display: 'flex', alignItems: 'center', gap: 1,
                  border: '1px solid rgba(22,63,107,.12)',
                  minWidth: 110,
                }}
              >
                <Box sx={{
                  width: 32, height: 32, borderRadius: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: s.color + '1a',
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, color: '#5a6d80', lineHeight: 1 }}>{s.label}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.value ?? '—'}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Search box */}
          <TextField
            size="small"
            placeholder={locale === 'th' ? 'ค้นหาทักษะ/บทความ/bookmark' : 'Search knowledge…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: '#5a6d80' }}>search</span>
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>close</span>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Search results overlay */}
        {showSearchResults && (
          <Paper elevation={0} sx={{ mb: 2.5, border: '1px solid rgba(22,63,107,.12)', p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>search</span>
              {locale === 'th' ? `ผลการค้นหา "${search}"` : `Results for "${search}"`}
            </Typography>

            {/* Article results */}
            {searchResults.articles?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', mb: .75 }}>
                  📄 {locale === 'th' ? 'บทความ' : 'Articles'} ({searchResults.articles.length})
                </Typography>
                {searchResults.articles.map((a: any) => (
                  <Box key={a.id} sx={{ py: .75, borderBottom: '1px solid rgba(22,63,107,.08)' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a.title}</Typography>
                    {a.summary && <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{a.summary}</Typography>}
                  </Box>
                ))}
              </Box>
            )}

            {/* Skill results */}
            {searchResults.skills?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', mb: .75 }}>
                  🎯 {locale === 'th' ? 'ทักษะ' : 'Skills'} ({searchResults.skills.length})
                </Typography>
                {searchResults.skills.map((s: any) => (
                  <Box key={s.id} sx={{ py: .75, borderBottom: '1px solid rgba(22,63,107,.08)', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13 }}>{s.name}</Typography>
                    <Chip label={'⭐'.repeat(s.proficiency || 0)} size="small" sx={{ fontSize: 10 }} />
                  </Box>
                ))}
              </Box>
            )}

            {/* Bookmark results */}
            {searchResults.bookmarks?.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', mb: .75 }}>
                  🔖 {locale === 'th' ? 'Bookmark' : 'Bookmarks'} ({searchResults.bookmarks.length})
                </Typography>
                {searchResults.bookmarks.map((b: any) => (
                  <Box key={b.id} sx={{ py: .75, borderBottom: '1px solid rgba(22,63,107,.08)' }}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#005b9f', textDecoration: 'none' }}>
                      {b.title} ↗
                    </a>
                    {b.description && <Typography sx={{ fontSize: 11, color: '#5a6d80' }}>{b.description}</Typography>}
                  </Box>
                ))}
              </Box>
            )}

            {searchResults.articles?.length === 0 && searchResults.skills?.length === 0 && searchResults.bookmarks?.length === 0 && (
              <Alert severity="info" sx={{ fontSize: 12 }}>
                {locale === 'th' ? 'ไม่พบผลการค้นหา' : 'No results found'}
              </Alert>
            )}
          </Paper>
        )}

        {/* Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: '1px solid rgba(22,63,107,.08)',
              minHeight: 44,
              '& .MuiTab-root': { minHeight: 44, fontSize: 12, fontWeight: 600, textTransform: 'none' },
            }}
          >
            {tabs.map((t, i) => (
              <Tab
                key={i}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                    {t.label}
                    <Chip label={t.count} size="small" sx={{ height: 18, fontSize: 10, ml: .5 }} />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 0 && <SkillsTab categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />}
            {tab === 1 && <ArticlesTab categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />}
            {tab === 2 && <BookmarksTab categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />}
            {tab === 3 && <CategoriesTab />}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
