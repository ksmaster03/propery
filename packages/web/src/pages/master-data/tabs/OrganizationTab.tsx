import { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, IconButton, Chip, Alert, Divider,
  Table, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Switch,
} from '@mui/material';
import { useTranslation } from '../../../lib/i18n';
import { useMaster, useCreateMaster, useUpdateMaster, useDeleteMaster, Organization } from '../../../api/master-hooks';

// === Tab จัดการหน่วยงาน / Organization ===
// หน่วยงานเป็น master หลัก ที่ระบบทั้งหมดใช้อ้างอิง (logo, ชื่อ, %แบ่งรายได้)
export default function OrganizationTab() {
  const { locale } = useTranslation();
  const { data: orgs = [], isLoading } = useMaster<Organization>('organizations');
  const createMut = useCreateMaster<Organization>('organizations');
  const updateMut = useUpdateMaster<Organization>('organizations');
  const deleteMut = useDeleteMaster('organizations');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<Partial<Organization>>({});

  const handleAdd = () => {
    setEditing(null);
    setForm({
      isActive: true,
      isDefault: false,
      treasuryPct: 50,
      welfareFundPct: 20,
      revolvingFundPct: 30,
    });
    setDialogOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setEditing(org);
    setForm({ ...org });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        treasuryPct: Number(form.treasuryPct || 0),
        welfareFundPct: Number(form.welfareFundPct || 0),
        revolvingFundPct: Number(form.revolvingFundPct || 0),
      };
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(locale === 'th' ? 'ยืนยันการลบหน่วยงานนี้?' : 'Delete this organization?')) return;
    await deleteMut.mutateAsync(id);
  };

  const pctTotal = Number(form.treasuryPct || 0) + Number(form.welfareFundPct || 0) + Number(form.revolvingFundPct || 0);

  return (
    <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
      <Box sx={{
        px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)',
        display: 'flex', alignItems: 'center', gap: 1,
        background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)',
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {locale === 'th' ? 'หน่วยงาน / องค์กร' : 'Organizations'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#5a6d80', mt: .2 }}>
            {locale === 'th'
              ? 'กำหนดหน่วยงานที่ใช้ระบบนี้ — ชื่อองค์กร, เลขภาษี, %แบ่งรายได้'
              : 'Define organizations using this system — name, tax ID, revenue split %'}
          </Typography>
        </Box>
        <Button variant="contained" size="small" onClick={handleAdd}>
          <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add_business</span>
          {locale === 'th' ? 'เพิ่มหน่วยงาน' : 'Add Organization'}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center', color: '#5a6d80' }}>{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</Box>
      ) : orgs.length === 0 ? (
        <Alert severity="info" sx={{ m: 2, fontSize: 11 }}>
          {locale === 'th' ? 'ยังไม่มีหน่วยงาน' : 'No organizations yet'}
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f4f8fc' }}>
              <TableCell>{locale === 'th' ? 'รหัส' : 'Code'}</TableCell>
              <TableCell>{locale === 'th' ? 'ชื่อหน่วยงาน' : 'Organization Name'}</TableCell>
              <TableCell>{locale === 'th' ? 'เลขภาษี' : 'Tax ID'}</TableCell>
              <TableCell>{locale === 'th' ? 'ติดต่อ' : 'Contact'}</TableCell>
              <TableCell align="center">{locale === 'th' ? 'แบ่งรายได้ (%)' : 'Revenue Split (%)'}</TableCell>
              <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
              <TableCell align="center">{locale === 'th' ? 'จัดการ' : 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id} hover>
                <TableCell>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>
                    {org.orgCode}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1,
                      bgcolor: 'rgba(0,91,159,.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>business</span>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{org.nameTh}</Typography>
                      {org.nameEn && <Typography sx={{ fontSize: 10.5, color: '#5a6d80' }}>{org.nameEn}</Typography>}
                    </Box>
                    {org.isDefault && (
                      <Chip label={locale === 'th' ? 'เริ่มต้น' : 'Default'} size="small" sx={{ fontSize: 9, height: 18, bgcolor: 'rgba(215,169,75,.15)', color: '#b2832d' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{org.taxId || '—'}</TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 11 }}>{org.phone || '—'}</Typography>
                  <Typography sx={{ fontSize: 10, color: '#5a6d80' }}>{org.email || '—'}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {org.treasuryPct || 0} / {org.welfareFundPct || 0} / {org.revolvingFundPct || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={org.isActive ? (locale === 'th' ? 'ใช้งาน' : 'Active') : (locale === 'th' ? 'ปิด' : 'Inactive')}
                    size="small"
                    sx={{
                      fontSize: 10, fontWeight: 700, height: 20,
                      bgcolor: org.isActive ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                      color: org.isActive ? '#0f7a43' : '#5a6d80',
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEdit(org)} sx={{ color: '#005b9f' }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(org.id)} sx={{ color: '#b52822' }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>delete</span>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          {editing ? (locale === 'th' ? 'แก้ไขหน่วยงาน' : 'Edit Organization') : (locale === 'th' ? 'เพิ่มหน่วยงานใหม่' : 'New Organization')}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {/* ข้อมูลพื้นฐาน */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', textTransform: 'uppercase', letterSpacing: .5, mb: 1, mt: 1 }}>
            {locale === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Info'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2, mb: 2 }}>
            <TextField size="small" label={locale === 'th' ? 'รหัสองค์กร' : 'Org Code'} required value={form.orgCode || ''} onChange={(e) => setForm({ ...form, orgCode: e.target.value })} />
            <TextField size="small" label={locale === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'} value={form.taxId || ''} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <TextField size="small" label={locale === 'th' ? 'ชื่อเต็ม (ไทย)' : 'Full Name (Thai)'} required value={form.nameTh || ''} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} sx={{ gridColumn: '1/3' }} />
            <TextField size="small" label={locale === 'th' ? 'ชื่อเต็ม (อังกฤษ)' : 'Full Name (English)'} value={form.nameEn || ''} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} sx={{ gridColumn: '1/3' }} />
            <TextField size="small" label={locale === 'th' ? 'ชื่อย่อ (ไทย)' : 'Short Name (Thai)'} value={form.shortNameTh || ''} onChange={(e) => setForm({ ...form, shortNameTh: e.target.value })} />
            <TextField size="small" label={locale === 'th' ? 'ชื่อย่อ (อังกฤษ)' : 'Short Name (English)'} value={form.shortNameEn || ''} onChange={(e) => setForm({ ...form, shortNameEn: e.target.value })} />
          </Box>

          {/* ติดต่อ */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', textTransform: 'uppercase', letterSpacing: .5, mb: 1 }}>
            {locale === 'th' ? 'ติดต่อ' : 'Contact'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField size="small" label={locale === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField size="small" label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField size="small" label="Website" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} sx={{ gridColumn: '1/3' }} />
            <TextField size="small" label={locale === 'th' ? 'ที่อยู่' : 'Address'} multiline rows={2} value={form.addressTh || ''} onChange={(e) => setForm({ ...form, addressTh: e.target.value })} sx={{ gridColumn: '1/3' }} />
          </Box>

          {/* Revenue split */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', textTransform: 'uppercase', letterSpacing: .5, mb: 1 }}>
            {locale === 'th' ? 'สัดส่วนการแบ่งรายได้ (%)' : 'Revenue Split (%)'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 1 }}>
            <TextField size="small" type="number" label={locale === 'th' ? 'กรมธนารักษ์' : 'Treasury'} value={form.treasuryPct ?? ''} onChange={(e) => setForm({ ...form, treasuryPct: Number(e.target.value) })} />
            <TextField size="small" type="number" label={locale === 'th' ? 'กองทุนสวัสดิการ' : 'Welfare Fund'} value={form.welfareFundPct ?? ''} onChange={(e) => setForm({ ...form, welfareFundPct: Number(e.target.value) })} />
            <TextField size="small" type="number" label={locale === 'th' ? 'เงินทุนหมุนเวียน' : 'Revolving Fund'} value={form.revolvingFundPct ?? ''} onChange={(e) => setForm({ ...form, revolvingFundPct: Number(e.target.value) })} />
          </Box>
          {pctTotal !== 100 && (
            <Alert severity={pctTotal === 0 ? 'info' : 'warning'} sx={{ fontSize: 11, mb: 2 }}>
              {locale === 'th' ? 'รวมแล้ว' : 'Total'}: {pctTotal}% {pctTotal !== 100 && (locale === 'th' ? '(ควรเท่ากับ 100%)' : '(should equal 100%)')}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel control={<Switch checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'เปิดใช้งาน' : 'Active'}</Typography>} />
            <FormControlLabel control={<Switch checked={form.isDefault ?? false} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />} label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'ตั้งเป็นหน่วยงานหลัก' : 'Set as default'}</Typography>} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึก' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
