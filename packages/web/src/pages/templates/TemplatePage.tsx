import { Box, Paper, Typography, Button, Chip, IconButton } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

const templates = [
  { id: 1, code: 'TPL-FIXED-V2', nameTh: 'สัญญาเช่าค่าคงที่ (มาตรฐาน)', nameEn: 'Fixed Rent Contract (Standard)', type: 'FIXED_RENT', version: 2, active: true, updated: '2026-03-15' },
  { id: 2, code: 'TPL-REV-V1', nameTh: 'สัญญาปันผลประโยชน์', nameEn: 'Revenue Sharing Contract', type: 'REVENUE_SHARING', version: 1, active: true, updated: '2026-02-10' },
  { id: 3, code: 'TPL-CONSIGN-V1', nameTh: 'สัญญาฝากขาย', nameEn: 'Consignment Contract', type: 'CONSIGNMENT', version: 1, active: true, updated: '2026-01-22' },
  { id: 4, code: 'TPL-RE-V1', nameTh: 'สัญญาเช่าอสังหาริมทรัพย์', nameEn: 'Real Estate Lease', type: 'REAL_ESTATE', version: 1, active: true, updated: '2025-12-05' },
  { id: 5, code: 'TPL-RECEIPT', nameTh: 'ใบเสร็จรับเงิน', nameEn: 'Payment Receipt', type: 'RECEIPT', version: 3, active: true, updated: '2026-03-28' },
  { id: 6, code: 'TPL-BILL', nameTh: 'ใบแจ้งหนี้ค่าเช่า', nameEn: 'Rental Bill', type: 'BILL', version: 2, active: true, updated: '2026-03-28' },
  { id: 7, code: 'TPL-FIXED-V1', nameTh: 'สัญญาเช่าค่าคงที่ (เก่า)', nameEn: 'Fixed Rent Contract (Old)', type: 'FIXED_RENT', version: 1, active: false, updated: '2025-06-10' },
];

const typeIcons: Record<string, { icon: string; color: string }> = {
  FIXED_RENT: { icon: 'price_change', color: '#005b9f' },
  REVENUE_SHARING: { icon: 'percent', color: '#0f7a43' },
  CONSIGNMENT: { icon: 'storefront', color: '#a45a00' },
  REAL_ESTATE: { icon: 'apartment', color: '#7c3aed' },
  RECEIPT: { icon: 'receipt_long', color: '#d7a94b' },
  BILL: { icon: 'credit_card', color: '#0f73b8' },
};

export default function TemplatePage() {
  const { locale } = useTranslation();

  return (
    <>
      <PageHeader
        icon="📄"
        title={locale === 'th' ? 'Template เอกสารสัญญา' : 'Document Templates'}
        subtitle={locale === 'th' ? 'จัดการเทมเพลตเอกสารสำหรับสัญญา, บิล, และใบเสร็จ' : 'Manage templates for contracts, bills, and receipts'}
        actions={
          <Button variant="contained" size="small" sx={{ fontSize: 11 }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
            {locale === 'th' ? 'สร้าง Template ใหม่' : 'New Template'}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {templates.map((tpl) => {
            const t = typeIcons[tpl.type] || typeIcons.FIXED_RENT;
            return (
              <Paper
                key={tpl.id}
                elevation={0}
                sx={{
                  p: 2, border: '1px solid rgba(22,63,107,.12)',
                  boxShadow: '0 2px 12px rgba(10,22,40,.08)',
                  opacity: tpl.active ? 1 : 0.55,
                  transition: 'all .15s',
                  '&:hover': { boxShadow: '0 8px 28px rgba(10,22,40,.12)', transform: 'translateY(-2px)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 1.5,
                    bgcolor: `${t.color}15`, border: `1px solid ${t.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-icons-outlined" style={{ fontSize: 24, color: t.color }}>{t.icon}</span>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
                      {locale === 'th' ? tpl.nameTh : tpl.nameEn}
                    </Typography>
                    <Typography sx={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: '#5a6d80', mt: .25 }}>
                      {tpl.code}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Chip label={`v${tpl.version}`} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: `${t.color}15`, color: t.color, border: `1px solid ${t.color}40` }} />
                  <Chip
                    label={tpl.active ? (locale === 'th' ? 'ใช้งาน' : 'Active') : (locale === 'th' ? 'ยกเลิก' : 'Inactive')}
                    size="small"
                    sx={{
                      fontSize: 10, fontWeight: 700, height: 20,
                      bgcolor: tpl.active ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                      color: tpl.active ? '#0f7a43' : '#5a6d80',
                      border: `1px solid ${tpl.active ? 'rgba(26,158,92,.25)' : 'rgba(22,63,107,.12)'}`,
                    }}
                  />
                </Box>

                <Typography sx={{ fontSize: 10.5, color: '#5a6d80', mb: 2 }}>
                  {locale === 'th' ? 'อัปเดตล่าสุด' : 'Updated'}: {tpl.updated}
                </Typography>

                <Box sx={{ display: 'flex', gap: .5, justifyContent: 'flex-end', borderTop: '1px solid rgba(22,63,107,.06)', pt: 1.5 }}>
                  <IconButton size="small" sx={{ color: '#005b9f' }} title={locale === 'th' ? 'แก้ไข' : 'Edit'}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#5a6d80' }} title={locale === 'th' ? 'ดูตัวอย่าง' : 'Preview'}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>visibility</span>
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#0f7a43' }} title={locale === 'th' ? 'ดาวน์โหลด' : 'Download'}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>download</span>
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#a45a00' }} title={locale === 'th' ? 'คัดลอก' : 'Duplicate'}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>content_copy</span>
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
