import { Box, Paper, Typography, Button, Select, MenuItem, Alert, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';

// ข้อมูล mock ประวัติการนำเข้า/ส่งออก
const mockHistory = [
  { id: 1, type: 'IMPORT', category: 'partners', fileName: 'partners_2026q1.xlsx', records: 12, status: 'SUCCESS', date: '2026-03-15 14:32' },
  { id: 2, type: 'EXPORT', category: 'contracts', fileName: 'contracts_202603.xlsx', records: 34, status: 'SUCCESS', date: '2026-03-10 09:15' },
  { id: 3, type: 'IMPORT', category: 'units', fileName: 'units_floorplan.csv', records: 48, status: 'SUCCESS', date: '2026-02-28 16:20' },
  { id: 4, type: 'IMPORT', category: 'partners', fileName: 'partners_bad.xlsx', records: 8, status: 'ERROR', date: '2026-02-15 11:05', error: '3 รายการซ้ำ' },
];

export default function ImportExport() {
  const { t, locale } = useTranslation();

  return (
    <>
      <PageHeader
        icon="📥"
        title={t('nav.importExport')}
        subtitle={locale === 'th' ? 'นำเข้าและส่งออกข้อมูลในรูปแบบ CSV/Excel' : 'Import and export data in CSV/Excel format'}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* 2 cards หลัก */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Import */}
          <Paper elevation={0} sx={{ p: 3, border: '2px dashed rgba(0,91,159,.2)', borderRadius: 2, textAlign: 'center' }}>
            <span className="material-icons-outlined" style={{ fontSize: 48, color: '#005b9f' }}>cloud_upload</span>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 1, mb: .5 }}>
              {locale === 'th' ? '📥 นำเข้าข้อมูล' : '📥 Import Data'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#5a6d80', mb: 2 }}>
              {locale === 'th' ? 'รองรับไฟล์ .csv, .xlsx ขนาดไม่เกิน 10MB' : 'Supports .csv, .xlsx up to 10MB'}
            </Typography>
            <Select size="small" defaultValue="partners" fullWidth sx={{ mb: 2, fontSize: 12 }}>
              <MenuItem value="partners">{locale === 'th' ? 'ฐานข้อมูลผู้เช่า (Partners)' : 'Partners Database'}</MenuItem>
              <MenuItem value="units">{locale === 'th' ? 'พื้นที่เช่า (Units)' : 'Rental Units'}</MenuItem>
              <MenuItem value="contracts">{locale === 'th' ? 'สัญญาเช่า (Contracts)' : 'Contracts'}</MenuItem>
              <MenuItem value="bills">{locale === 'th' ? 'ใบแจ้งหนี้ (Bills)' : 'Bills'}</MenuItem>
            </Select>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant="contained" size="small">
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload_file</span>
                {locale === 'th' ? 'เลือกไฟล์' : 'Choose File'}
              </Button>
              <Button variant="outlined" size="small">
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>description</span>
                {locale === 'th' ? 'ดาวน์โหลด Template' : 'Download Template'}
              </Button>
            </Box>
            <Alert severity="info" sx={{ mt: 2, fontSize: 11, textAlign: 'left' }}>
              {locale === 'th' ? '💡 ระบบจะตรวจสอบข้อมูลและแจ้งรายการที่ซ้ำหรือผิดรูปแบบก่อนบันทึก' : '💡 System will validate and report duplicates before saving'}
            </Alert>
          </Paper>

          {/* Export */}
          <Paper elevation={0} sx={{ p: 3, border: '2px dashed rgba(26,158,92,.2)', borderRadius: 2, textAlign: 'center' }}>
            <span className="material-icons-outlined" style={{ fontSize: 48, color: '#0f7a43' }}>cloud_download</span>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 1, mb: .5 }}>
              {locale === 'th' ? '📤 ส่งออกข้อมูล' : '📤 Export Data'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#5a6d80', mb: 2 }}>
              {locale === 'th' ? 'ส่งออกเป็น Excel หรือ CSV ตามช่วงเวลา' : 'Export as Excel or CSV by date range'}
            </Typography>
            <Select size="small" defaultValue="contracts" fullWidth sx={{ mb: 2, fontSize: 12 }}>
              <MenuItem value="contracts">{locale === 'th' ? 'รายการสัญญา' : 'Contract List'}</MenuItem>
              <MenuItem value="bills">{locale === 'th' ? 'รายการบิล' : 'Bill List'}</MenuItem>
              <MenuItem value="receipts">{locale === 'th' ? 'รายการใบเสร็จ' : 'Receipt List'}</MenuItem>
              <MenuItem value="revenue">{locale === 'th' ? 'รายงานรายได้' : 'Revenue Report'}</MenuItem>
            </Select>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant="contained" size="small" color="success">
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>table_chart</span>
                Export Excel
              </Button>
              <Button variant="outlined" size="small" color="success">
                <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>description</span>
                Export CSV
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* ประวัติ */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)', background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              📜 {locale === 'th' ? 'ประวัติการนำเข้า/ส่งออก' : 'Import/Export History'}
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                <TableCell>{locale === 'th' ? 'ประเภท' : 'Type'}</TableCell>
                <TableCell>{locale === 'th' ? 'หมวด' : 'Category'}</TableCell>
                <TableCell>{locale === 'th' ? 'ชื่อไฟล์' : 'File Name'}</TableCell>
                <TableCell align="right">{locale === 'th' ? 'จำนวน' : 'Records'}</TableCell>
                <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                <TableCell>{locale === 'th' ? 'วันที่' : 'Date'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockHistory.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                      <span className="material-icons-outlined" style={{ fontSize: 16, color: h.type === 'IMPORT' ? '#005b9f' : '#0f7a43' }}>
                        {h.type === 'IMPORT' ? 'file_download' : 'file_upload'}
                      </span>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: h.type === 'IMPORT' ? '#005b9f' : '#0f7a43' }}>{h.type}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{h.category}</TableCell>
                  <TableCell sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{h.fileName}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{h.records}</TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: .3, px: 1, py: .25, borderRadius: 999,
                      bgcolor: h.status === 'SUCCESS' ? 'rgba(26,158,92,.1)' : 'rgba(217,83,79,.1)',
                      color: h.status === 'SUCCESS' ? '#0f7a43' : '#b52822',
                      border: `1px solid ${h.status === 'SUCCESS' ? 'rgba(26,158,92,.25)' : 'rgba(217,83,79,.25)'}`,
                      fontSize: 10, fontWeight: 700,
                    }}>
                      <span className="material-icons-outlined" style={{ fontSize: 12 }}>{h.status === 'SUCCESS' ? 'check' : 'error'}</span>
                      {h.status}
                    </Box>
                    {h.error && <Typography sx={{ fontSize: 10, color: '#b52822', mt: .2 }}>{h.error}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, color: '#5a6d80' }}>{h.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </>
  );
}
