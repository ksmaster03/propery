import { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, IconButton, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Switch,
} from '@mui/material';
import { useTranslation } from '../../lib/i18n';
import { useMaster, useCreateMaster, useUpdateMaster, useDeleteMaster, MasterEntity } from '../../api/master-hooks';

// === CRUD table สำหรับ master data แบบง่าย ===
// รองรับ fields: code, nameTh, nameEn, icon?, sortOrder?, custom extras

export interface Field {
  key: string;
  labelTh: string;
  labelEn: string;
  type?: 'text' | 'number' | 'icon' | 'color' | 'switch';
  required?: boolean;
  readonly?: boolean;
}

interface Props {
  entity: MasterEntity;
  fields: Field[];
  titleTh: string;
  titleEn: string;
  descriptionTh?: string;
  descriptionEn?: string;
}

export default function SimpleCrudTable({ entity, fields, titleTh, titleEn, descriptionTh, descriptionEn }: Props) {
  const { locale } = useTranslation();
  const { data = [], isLoading } = useMaster(entity);
  const createMut = useCreateMaster(entity);
  const updateMut = useUpdateMaster(entity);
  const deleteMut = useDeleteMaster(entity);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ sortOrder: (data.length + 1) * 10, isActive: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await updateMut.mutateAsync({ id: editingItem.id, ...form });
      } else {
        await createMut.mutateAsync(form);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(locale === 'th' ? 'ยืนยันการลบข้อมูลนี้?' : 'Delete this item?')) return;
    await deleteMut.mutateAsync(id);
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
      {/* Header */}
      <Box sx={{
        px: 2.25, py: 1.5, borderBottom: '1px solid rgba(22,63,107,.08)',
        display: 'flex', alignItems: 'center', gap: 1,
        background: 'linear-gradient(180deg, rgba(0,91,159,.04), transparent)',
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {locale === 'th' ? titleTh : titleEn}
          </Typography>
          {descriptionTh && (
            <Typography sx={{ fontSize: 11, color: '#6c7f92', mt: .2 }}>
              {locale === 'th' ? descriptionTh : descriptionEn}
            </Typography>
          )}
        </Box>
        <Button variant="contained" size="small" onClick={handleOpenAdd}>
          <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
          {locale === 'th' ? 'เพิ่ม' : 'Add'}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center', color: '#6c7f92' }}>
          {locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}
        </Box>
      ) : data.length === 0 ? (
        <Alert severity="info" sx={{ m: 2, fontSize: 11 }}>
          {locale === 'th' ? 'ยังไม่มีข้อมูล คลิก "เพิ่ม" เพื่อสร้างใหม่' : 'No data yet. Click "Add" to create.'}
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f4f8fc' }}>
              {fields.map((f) => (
                <TableCell key={f.key}>{locale === 'th' ? f.labelTh : f.labelEn}</TableCell>
              ))}
              <TableCell sx={{ width: 80 }}>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
              <TableCell sx={{ width: 100 }} align="center">{locale === 'th' ? 'จัดการ' : 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any) => (
              <TableRow key={item.id} hover>
                {fields.map((f) => (
                  <TableCell key={f.key}>
                    {f.type === 'icon' && item[f.key] ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18, color: item.color || '#6c7f92' }}>{item[f.key]}</span>
                        <Typography sx={{ fontSize: 11, color: '#6c7f92' }}>{item[f.key]}</Typography>
                      </Box>
                    ) : f.type === 'color' && item[f.key] ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: .5, bgcolor: item[f.key], border: '1px solid rgba(0,0,0,.1)' }} />
                        <Typography sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{item[f.key]}</Typography>
                      </Box>
                    ) : f.type === 'switch' ? (
                      <Chip label={item[f.key] ? '✓' : '✗'} size="small" sx={{ fontSize: 10, height: 20, bgcolor: item[f.key] ? 'rgba(26,158,92,.1)' : '#f4f8fc', color: item[f.key] ? '#1a9e5c' : '#6c7f92' }} />
                    ) : (
                      <Typography sx={{ fontSize: 12, fontFamily: f.key === 'code' ? "'IBM Plex Mono', monospace" : 'inherit', fontWeight: f.key === 'code' ? 700 : 400, color: f.key === 'code' ? '#005b9f' : 'inherit' }}>
                        {item[f.key] != null ? String(item[f.key]) : '—'}
                      </Typography>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <Chip
                    label={item.isActive ? (locale === 'th' ? 'ใช้งาน' : 'Active') : (locale === 'th' ? 'ปิด' : 'Inactive')}
                    size="small"
                    sx={{
                      fontSize: 10, fontWeight: 700, height: 20,
                      bgcolor: item.isActive ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                      color: item.isActive ? '#1a9e5c' : '#6c7f92',
                      border: `1px solid ${item.isActive ? 'rgba(26,158,92,.25)' : 'rgba(22,63,107,.12)'}`,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: '#005b9f' }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: '#d9534f' }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>delete</span>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog add/edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          {editingItem ? (locale === 'th' ? 'แก้ไข' : 'Edit') : (locale === 'th' ? 'เพิ่ม' : 'Add')} · {locale === 'th' ? titleTh : titleEn}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            {fields.map((f) => (
              <TextField
                key={f.key}
                size="small"
                label={locale === 'th' ? f.labelTh : f.labelEn}
                required={f.required}
                type={f.type === 'number' ? 'number' : 'text'}
                disabled={f.readonly}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                sx={{ gridColumn: f.key === 'nameTh' || f.key === 'nameEn' ? '1/3' : undefined }}
              />
            ))}
            <FormControlLabel
              control={<Switch checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label={<Typography sx={{ fontSize: 12 }}>{locale === 'th' ? 'เปิดใช้งาน' : 'Active'}</Typography>}
              sx={{ gridColumn: '1/3' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(22,63,107,.12)' }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={createMut.isPending || updateMut.isPending}>
            {createMut.isPending || updateMut.isPending
              ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...')
              : (locale === 'th' ? 'บันทึก' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
