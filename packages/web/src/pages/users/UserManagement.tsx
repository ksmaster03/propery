import { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, InputAdornment,
  FormControlLabel, Switch,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';

// === Types ===
interface User {
  id: number;
  userId: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  role: string;
  isActive: boolean;
  phone?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

// === Role config ===
const ROLES = [
  { value: 'ADMIN', labelTh: 'ผู้ดูแลระบบ', labelEn: 'Administrator', color: '#b52822' },
  { value: 'SUPERVISOR', labelTh: 'หัวหน้างาน', labelEn: 'Supervisor', color: '#a45a00' },
  { value: 'OPERATOR', labelTh: 'เจ้าหน้าที่', labelEn: 'Operator', color: '#0f73b8' },
];

export default function UserManagement() {
  const { locale } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');

  // === Fetch users ===
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: async (): Promise<User[]> => {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const { data } = await api.get('/users', { params });
      return data.data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/users', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
    },
    onError: (err: any) => setError(err.response?.data?.error || 'เกิดข้อผิดพลาด'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/users/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
    },
    onError: (err: any) => setError(err.response?.data?.error || 'เกิดข้อผิดพลาด'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleAdd = () => {
    setEditing(null);
    setForm({ role: 'OPERATOR', isActive: true });
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setForm({ ...user, password: '' });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    setError('');
    if (editing) {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      updateMut.mutate({ id: editing.id, ...payload });
    } else {
      if (!form.username || !form.password) {
        setError(locale === 'th' ? 'กรุณากรอก username และ password' : 'Username and password required');
        return;
      }
      createMut.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm(locale === 'th' ? 'ยืนยันการปิดบัญชีผู้ใช้นี้?' : 'Disable this user?')) return;
    deleteMut.mutate(id);
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <>
      <PageHeader
        icon="👥"
        title={locale === 'th' ? 'จัดการผู้ใช้ระบบ' : 'User Management'}
        subtitle={locale === 'th' ? `${users.length} คนในระบบ` : `${users.length} users in system`}
        actions={
          <Button variant="contained" size="small" onClick={handleAdd}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>person_add</span>
            {locale === 'th' ? 'เพิ่มผู้ใช้' : 'Add User'}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* Filter bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder={locale === 'th' ? 'ค้นหา username, ชื่อ, email...' : 'Search username, name, email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: '#5a6d80' }}>search</span>
                </InputAdornment>
              ),
            }}
          />
          <Select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="ALL">{locale === 'th' ? 'ทุกบทบาท' : 'All Roles'}</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>{locale === 'th' ? r.labelTh : r.labelEn}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Table */}
        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#5a6d80' }}>{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</Box>
          ) : users.length === 0 ? (
            <Alert severity="info" sx={{ m: 2, fontSize: 11 }}>
              {locale === 'th' ? 'ยังไม่มีผู้ใช้ในระบบ' : 'No users in system'}
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                  <TableCell>{locale === 'th' ? 'รหัส' : 'ID'}</TableCell>
                  <TableCell>{locale === 'th' ? 'Username' : 'Username'}</TableCell>
                  <TableCell>{locale === 'th' ? 'ชื่อ-สกุล' : 'Full Name'}</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>{locale === 'th' ? 'บทบาท' : 'Role'}</TableCell>
                  <TableCell>{locale === 'th' ? 'เข้าระบบล่าสุด' : 'Last Login'}</TableCell>
                  <TableCell>{locale === 'th' ? 'สถานะ' : 'Status'}</TableCell>
                  <TableCell align="center">{locale === 'th' ? 'จัดการ' : 'Actions'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const role = ROLES.find((r) => r.value === u.role);
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>{u.userId}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{u.username}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{u.fullName || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: '#5a6d80' }}>{u.email || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={role ? (locale === 'th' ? role.labelTh : role.labelEn) : u.role}
                          size="small"
                          sx={{
                            fontSize: 10, fontWeight: 700, height: 22,
                            bgcolor: role ? `${role.color}15` : '#f4f8fc',
                            color: role?.color || '#5a6d80',
                            border: `1px solid ${role?.color || '#ccc'}40`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: '#5a6d80' }}>{formatDate(u.lastLoginAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? (locale === 'th' ? 'ใช้งาน' : 'Active') : (locale === 'th' ? 'ปิด' : 'Disabled')}
                          size="small"
                          sx={{
                            fontSize: 10, fontWeight: 700, height: 20,
                            bgcolor: u.isActive ? 'rgba(26,158,92,.1)' : '#f4f8fc',
                            color: u.isActive ? '#0f7a43' : '#5a6d80',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEdit(u)} sx={{ color: '#005b9f' }}>
                          <span className="material-icons-outlined" style={{ fontSize: 18 }}>edit</span>
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(u.id)} sx={{ color: '#b52822' }}>
                          <span className="material-icons-outlined" style={{ fontSize: 18 }}>block</span>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(22,63,107,.12)' }}>
          {editing ? (locale === 'th' ? 'แก้ไขผู้ใช้' : 'Edit User') : (locale === 'th' ? 'เพิ่มผู้ใช้ใหม่' : 'Add New User')}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 11 }}>{error}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              size="small" label="Username" required disabled={!!editing}
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              size="small"
              label={editing ? (locale === 'th' ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'New Password (if changing)') : 'Password'}
              type="password"
              required={!editing}
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              size="small" label={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
              value={form.fullName || ''}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              sx={{ gridColumn: '1/3' }}
            />
            <TextField
              size="small" label="Email" type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              size="small" label={locale === 'th' ? 'เบอร์โทร' : 'Phone'}
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Select
              size="small"
              value={form.role || 'OPERATOR'}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              sx={{ gridColumn: '1/3' }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {locale === 'th' ? r.labelTh : r.labelEn} ({r.value})
                </MenuItem>
              ))}
            </Select>
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
    </>
  );
}
