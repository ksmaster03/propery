import { useState } from 'react';
import {
  Box, Paper, Typography, Chip, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import api from '../../api/client';

interface AuditLog {
  id: number;
  tableName: string;
  recordId: number;
  action: string;
  userId: string;
  ipAddress?: string | null;
  newValue?: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  CREATE: { color: '#0f7a43', bg: 'rgba(26,158,92,.1)' },
  UPDATE: { color: '#0f73b8', bg: 'rgba(15,115,184,.1)' },
  DELETE: { color: '#b52822', bg: 'rgba(217,83,79,.1)' },
  APPROVE: { color: '#7c3aed', bg: 'rgba(124,58,237,.1)' },
  PAYMENT: { color: '#d7a94b', bg: 'rgba(215,169,75,.1)' },
};

export default function AuditPage() {
  const { locale } = useTranslation();
  const [actionFilter, setActionFilter] = useState('ALL');
  const [tableFilter, setTableFilter] = useState('ALL');

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit', actionFilter, tableFilter],
    queryFn: async () => {
      const params: any = {};
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (tableFilter !== 'ALL') params.tableName = tableFilter;
      const { data } = await api.get('/audit', { params });
      return data.data || [];
    },
  });

  const formatTime = (d: string) =>
    new Date(d).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <>
      <PageHeader
        icon="📋"
        title={locale === 'th' ? 'Audit Trail — ประวัติการเปลี่ยนแปลง' : 'Audit Trail'}
        subtitle={locale === 'th' ? `${logs.length} รายการ` : `${logs.length} records`}
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Select size="small" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} sx={{ minWidth: 140, fontSize: 12 }}>
            <MenuItem value="ALL">{locale === 'th' ? 'ทุกการกระทำ' : 'All Actions'}</MenuItem>
            <MenuItem value="CREATE">CREATE</MenuItem>
            <MenuItem value="UPDATE">UPDATE</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
            <MenuItem value="APPROVE">APPROVE</MenuItem>
            <MenuItem value="PAYMENT">PAYMENT</MenuItem>
          </Select>
          <Select size="small" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} sx={{ minWidth: 160, fontSize: 12 }}>
            <MenuItem value="ALL">{locale === 'th' ? 'ทุกตาราง' : 'All Tables'}</MenuItem>
            <MenuItem value="t_contract">Contracts</MenuItem>
            <MenuItem value="t_bill">Bills</MenuItem>
            <MenuItem value="m_unit">Units</MenuItem>
            <MenuItem value="m_partner">Partners</MenuItem>
            <MenuItem value="m_user">Users</MenuItem>
            <MenuItem value="m_organization">Organizations</MenuItem>
          </Select>
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#5a6d80' }}>{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</Box>
          ) : logs.length === 0 ? (
            <Alert severity="info" sx={{ m: 2, fontSize: 11 }}>
              {locale === 'th' ? 'ยังไม่มีบันทึก audit — เริ่มใช้งานระบบเพื่อให้มีข้อมูล' : 'No audit logs yet'}
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                  <TableCell>{locale === 'th' ? 'เวลา' : 'Time'}</TableCell>
                  <TableCell>{locale === 'th' ? 'ผู้ใช้' : 'User'}</TableCell>
                  <TableCell>{locale === 'th' ? 'การกระทำ' : 'Action'}</TableCell>
                  <TableCell>{locale === 'th' ? 'ตาราง' : 'Table'}</TableCell>
                  <TableCell>{locale === 'th' ? 'Record ID' : 'Record ID'}</TableCell>
                  <TableCell>{locale === 'th' ? 'IP' : 'IP'}</TableCell>
                  <TableCell>{locale === 'th' ? 'รายละเอียด' : 'Details'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const ac = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE;
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: 11, color: '#5a6d80', whiteSpace: 'nowrap' }}>{formatTime(log.createdAt)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#005b9f' }}>{log.userId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" sx={{ fontSize: 9, fontWeight: 700, height: 20, bgcolor: ac.bg, color: ac.color, border: `1px solid ${ac.color}40` }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{log.tableName}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{log.recordId || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 10, color: '#5a6d80' }}>{log.ipAddress || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 10, color: '#5a6d80', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.newValue ? log.newValue.substring(0, 80) + (log.newValue.length > 80 ? '...' : '') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </>
  );
}
