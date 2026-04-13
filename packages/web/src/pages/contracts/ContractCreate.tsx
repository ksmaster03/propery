import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, Button,
  Radio, RadioGroup, FormControlLabel, Alert, Chip, Divider, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import { useMaster, BusinessCategory, DocumentType, PaymentMethod } from '../../api/master-hooks';
import api from '../../api/client';
import { generateSimplePdf } from '../../lib/pdf';

// === กำหนดขั้นตอน Wizard ===
const steps = [
  { key: 'area', icon: 'place', labelTh: 'ข้อมูลพื้นที่', labelEn: 'Area Info' },
  { key: 'tenant', icon: 'person', labelTh: 'ข้อมูลผู้เช่า', labelEn: 'Tenant Info' },
  { key: 'terms', icon: 'article', labelTh: 'เงื่อนไขสัญญา', labelEn: 'Contract Terms' },
  { key: 'deposit', icon: 'attach_money', labelTh: 'หลักประกัน/เอกสาร', labelEn: 'Deposit & Docs' },
  { key: 'preview', icon: 'preview', labelTh: 'ร่างสัญญา', labelEn: 'Preview' },
  { key: 'sign', icon: 'draw', labelTh: 'ลงนาม/ดาวน์โหลด', labelEn: 'Sign & Download' },
];

// === ประเภทสัญญา 4 แบบ ===
const contractTypes = [
  { value: 'FIXED_RENT', icon: 'price_change', labelTh: 'ค่าเช่าคงที่', labelEn: 'Fixed Rent', descTh: 'ชำระเท่ากันทุกเดือน', descEn: 'Fixed monthly payment' },
  { value: 'REVENUE_SHARING', icon: 'percent', labelTh: 'ปันผลประโยชน์', labelEn: 'Revenue Sharing', descTh: 'แบ่งตาม % ยอดขาย', descEn: '% of sales revenue' },
  { value: 'CONSIGNMENT', icon: 'storefront', labelTh: 'ฝากขาย', labelEn: 'Consignment', descTh: 'ค่าคอมมิชชั่นจากยอดขาย', descEn: 'Commission-based' },
  { value: 'REAL_ESTATE', icon: 'apartment', labelTh: 'อสังหาริมทรัพย์', labelEn: 'Real Estate', descTh: 'ที่ดิน/อาคาร', descEn: 'Land / Building' },
];

export default function ContractCreate() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [contractType, setContractType] = useState<'FIXED_RENT' | 'REVENUE_SHARING' | 'CONSIGNMENT' | 'REAL_ESTATE'>('FIXED_RENT');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [createdContractNo, setCreatedContractNo] = useState<string>('');

  // === Master data จาก API ===
  const { data: businessCats = [] } = useMaster<BusinessCategory>('business-categories');
  const { data: docTypes = [] } = useMaster<DocumentType>('document-types');
  const { data: paymentMethods = [] } = useMaster<PaymentMethod>('payment-methods');

  // === Track uploaded documents (docTypeId → filename) ===
  const [uploadedDocs, setUploadedDocs] = useState<Record<number, { filename: string; url: string }>>({});

  // Upload handler — ส่งไฟล์ขึ้น /api/upload
  const handleDocUpload = async (docId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setUploadedDocs({ ...uploadedDocs, [docId]: { filename: file.name, url: data.data.url } });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert(locale === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload failed');
    }
  };

  // === ข้อมูลสัญญาทั้งหมด ===
  const [formData, setFormData] = useState({
    // Step 1 — พื้นที่
    airportId: 'DMK',
    unitCode: 'A-104',
    building: 'อาคาร 1 / ชั้น 1 / โซน A',
    areaSqm: '68.5',
    purpose: 'ร้านยา',
    meterNumber: '',
    // Step 2 — ผู้เช่า
    tenantName: 'บริษัท เฮลท์พลัส จำกัด',
    taxId: '0105567082345',
    shopName: 'ร้านยา เฮลท์พลัส',
    contactPerson: 'นาย ประเสริฐ สุขดี',
    phone: '081-234-5678',
    email: 'prasert@healthplus.co.th',
    // Step 3 — เงื่อนไข
    startDate: '2026-04-01',
    endDate: '2029-03-31',
    paymentDueDay: 5,
    monthlyRent: '65000',
    magAmount: '80000',
    revenueSharePct: '15',
    commissionPct: '25',
    utilityRate: '4.50',
    commonServiceFee: '3500',
    latePenaltyRate: '15',
    // Step 4 — หลักประกัน
    depositType: 'CASH',
    depositAmount: '195000',
  });

  // ตรวจสอบความถูกต้องของ step ปัจจุบัน
  const goNext = () => setCurrentStep(Math.min(6, currentStep + 1));
  const goBack = () => setCurrentStep(Math.max(1, currentStep - 1));
  const goTo = (step: number) => setCurrentStep(step);

  // บันทึกสัญญาเข้า DB — เรียกก่อนไปหน้า Step 6
  const handleSaveContract = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload: any = {
        contractType,
        airportId: 1, // TODO: resolve from formData.airportId code → DB id
        unitId: 1,    // TODO: resolve from formData.unitCode → DB id
        partnerId: 1, // TODO: auto-create partner ถ้ายังไม่มี
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationMonths: 36,
        paymentDueDay: formData.paymentDueDay,
        latePenaltyRate: Number(formData.latePenaltyRate),
      };

      // ข้อมูลตามประเภทสัญญา
      if (contractType === 'FIXED_RENT') {
        payload.fixedRent = { monthlyRent: Number(formData.monthlyRent) };
      } else if (contractType === 'REVENUE_SHARING') {
        payload.revShare = {
          magAmount: Number(formData.magAmount),
          revenueSharePct: Number(formData.revenueSharePct),
          calcMethod: 'HIGHER_OF_MAG_OR_SHARE',
        };
      } else if (contractType === 'CONSIGNMENT') {
        payload.consignment = {
          commissionPct: Number(formData.commissionPct),
        };
      } else if (contractType === 'REAL_ESTATE') {
        payload.realEstate = { subType: 'LAND_ONLY' };
      }

      // หลักประกัน
      payload.deposit = {
        depositType: formData.depositType,
        calculatedAmount: Number(formData.depositAmount),
        approvedAmount: Number(formData.depositAmount),
      };

      const { data } = await api.post('/contracts', payload);
      if (data.success) {
        setCreatedContractNo(data.data.contractNo);
        goNext();
      } else {
        setSaveError(data.error || 'ไม่สามารถบันทึกสัญญาได้');
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        icon="➕"
        title={locale === 'th' ? 'สร้างสัญญาเช่าใหม่' : 'Create New Lease Contract'}
        subtitle={locale === 'th' ? 'กรอกข้อมูล 6 ขั้นตอน — ระบบจะสร้างเอกสารสัญญาให้อัตโนมัติ' : 'Fill in 6 steps — system will auto-generate contract document'}
        actions={
          <Button variant="outlined" size="small" onClick={() => navigate('/contracts')}>
            <span className="material-icons-outlined" style={{ fontSize: 16, marginRight: 4 }}>close</span>
            {t('common.cancel')}
          </Button>
        }
      />

      <Box tabIndex={0} sx={{ flex: 1, overflow: "auto", p: 2.75, "&:focus-visible": { outline: "2px solid #005b9f", outlineOffset: -2 } }}>
        {/* === Stepper === */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((step, idx) => {
              const stepNo = idx + 1;
              const isDone = stepNo < currentStep;
              const isActive = stepNo === currentStep;
              return (
                <Box key={step.key} sx={{ display: 'flex', alignItems: 'center', flex: stepNo < steps.length ? 1 : 'none' }}>
                  <Box
                    onClick={() => goTo(stepNo)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover .step-label': { color: '#005b9f' } }}
                  >
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: `2px solid ${isDone ? '#0f7a43' : isActive ? '#005b9f' : 'rgba(22,63,107,.2)'}`,
                      background: isDone ? '#0f7a43' : isActive ? '#005b9f' : '#fff',
                      color: isDone || isActive ? '#fff' : '#5a6d80',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {isDone ? '✓' : stepNo}
                    </Box>
                    <Typography
                      className="step-label"
                      sx={{
                        fontSize: 11.5, fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#005b9f' : isDone ? '#0f7a43' : '#5a6d80',
                      }}
                    >
                      {locale === 'th' ? step.labelTh : step.labelEn}
                    </Typography>
                  </Box>
                  {stepNo < steps.length && (
                    <Box sx={{ flex: 1, height: 2, mx: 1.5, bgcolor: isDone ? '#0f7a43' : 'rgba(22,63,107,.12)' }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* === เนื้อหา Step === */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(22,63,107,.12)', boxShadow: '0 2px 12px rgba(10,22,40,.08)' }}>
          {/* Step 1: ข้อมูลพื้นที่ */}
          {currentStep === 1 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>place</span>
                {locale === 'th' ? 'ข้อมูลพื้นที่เช่า' : 'Rental Area Information'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Select size="small" value={formData.airportId} onChange={(e) => setFormData({ ...formData, airportId: e.target.value })}>
                  <MenuItem value="DMK">{locale === 'th' ? 'ท่าอากาศยานดอนเมือง' : 'Don Mueang Airport'}</MenuItem>
                  <MenuItem value="CNX">{locale === 'th' ? 'ท่าอากาศยานเชียงใหม่' : 'Chiang Mai Airport'}</MenuItem>
                </Select>
                <Select size="small" value={formData.unitCode} onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}>
                  <MenuItem value="A-104">A-104 ({locale === 'th' ? 'ว่าง · 68.5 ตร.ม. · โซน A' : 'Vacant · 68.5 sqm · Zone A'})</MenuItem>
                  <MenuItem value="A-105">A-105 ({locale === 'th' ? 'ว่าง · 55 ตร.ม.' : 'Vacant · 55 sqm'})</MenuItem>
                  <MenuItem value="B-210">B-210 ({locale === 'th' ? 'ว่าง · 42 ตร.ม.' : 'Vacant · 42 sqm'})</MenuItem>
                </Select>
                <TextField size="small" label={locale === 'th' ? 'อาคาร/ชั้น/โซน' : 'Building/Floor/Zone'} value={formData.building} InputProps={{ readOnly: true }} sx={{ bgcolor: '#f4f8fc' }} />
                <TextField size="small" label={locale === 'th' ? 'ขนาดพื้นที่ (ตร.ม.)' : 'Area (sqm)'} value={formData.areaSqm} InputProps={{ readOnly: true }} sx={{ bgcolor: '#f4f8fc' }} />
                <Select size="small" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} displayEmpty>
                  <MenuItem value="" disabled>{locale === 'th' ? '— เลือกวัตถุประสงค์ —' : '— Select purpose —'}</MenuItem>
                  {businessCats.filter((c) => c.isActive).map((cat) => (
                    <MenuItem key={cat.id} value={cat.nameTh}>
                      {locale === 'th' ? cat.nameTh : (cat.nameEn || cat.nameTh)}
                    </MenuItem>
                  ))}
                </Select>
                <TextField size="small" label={locale === 'th' ? 'เลขมิเตอร์ไฟฟ้า' : 'Electric Meter No.'} value={formData.meterNumber} onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })} />
              </Box>
            </Box>
          )}

          {/* Step 2: ข้อมูลผู้เช่า */}
          {currentStep === 2 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>person</span>
                {locale === 'th' ? 'ข้อมูลผู้เช่า / คู่สัญญา' : 'Tenant Information'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField size="small" label={locale === 'th' ? 'ชื่อผู้เช่า / นิติบุคคล' : 'Tenant / Company Name'} required value={formData.tenantName} onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })} />
                <TextField size="small" label={locale === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'} required value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
                <TextField size="small" label={locale === 'th' ? 'ชื่อร้านค้า' : 'Shop Name'} required value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} />
                <TextField size="small" label={locale === 'th' ? 'ผู้ติดต่อ' : 'Contact Person'} required value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                <TextField size="small" label={locale === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'} required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <TextField size="small" label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </Box>
            </Box>
          )}

          {/* Step 3: เงื่อนไขสัญญา */}
          {currentStep === 3 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>article</span>
                {locale === 'th' ? 'เงื่อนไขสัญญาเช่า' : 'Contract Terms'}
              </Typography>

              {/* เลือกประเภทสัญญา */}
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', textTransform: 'uppercase', letterSpacing: .5, mb: 1 }}>
                {locale === 'th' ? 'ประเภทสัญญา *' : 'Contract Type *'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
                {contractTypes.map((ct) => (
                  <Box
                    key={ct.value}
                    onClick={() => setContractType(ct.value as any)}
                    sx={{
                      p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${contractType === ct.value ? '#005b9f' : 'rgba(22,63,107,.12)'}`,
                      background: contractType === ct.value ? 'rgba(0,91,159,.08)' : '#fff',
                      transition: 'all .15s',
                      '&:hover': { borderColor: '#005b9f', bgcolor: 'rgba(0,91,159,.04)' },
                    }}
                  >
                    <span className="material-icons-outlined" style={{ fontSize: 28, color: contractType === ct.value ? '#005b9f' : '#5a6d80' }}>{ct.icon}</span>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: contractType === ct.value ? '#005b9f' : '#17324a', mt: .5 }}>
                      {locale === 'th' ? ct.labelTh : ct.labelEn}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: '#5a6d80', mt: .25 }}>
                      {locale === 'th' ? ct.descTh : ct.descEn}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* วันที่และค่าใช้จ่ายทั่วไป */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 2 }}>
                <TextField size="small" type="date" label={locale === 'th' ? 'วันที่เริ่ม' : 'Start Date'} InputLabelProps={{ shrink: true }} value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                <TextField size="small" type="date" label={locale === 'th' ? 'วันที่สิ้นสุด' : 'End Date'} InputLabelProps={{ shrink: true }} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                <TextField size="small" label={locale === 'th' ? 'ระยะสัญญา' : 'Duration'} value={locale === 'th' ? '3 ปี (36 เดือน)' : '3 years (36 months)'} InputProps={{ readOnly: true }} sx={{ bgcolor: '#f4f8fc' }} />
                <Select size="small" value={formData.paymentDueDay} onChange={(e) => setFormData({ ...formData, paymentDueDay: Number(e.target.value) })}>
                  <MenuItem value={5}>{locale === 'th' ? 'ชำระวันที่ 5' : 'Due on 5th'}</MenuItem>
                  <MenuItem value={10}>{locale === 'th' ? 'ชำระวันที่ 10' : 'Due on 10th'}</MenuItem>
                  <MenuItem value={15}>{locale === 'th' ? 'ชำระวันที่ 15' : 'Due on 15th'}</MenuItem>
                </Select>
              </Box>

              {/* ฟิลด์ตามประเภท */}
              {contractType === 'FIXED_RENT' && (
                <>
                  <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                    <strong>{locale === 'th' ? 'สัญญาค่าเช่าคงที่' : 'Fixed Rent Contract'}</strong> — {locale === 'th' ? 'ผู้เช่าชำระค่าเช่าจำนวนคงที่ทุกเดือน' : 'Fixed monthly payment'}
                  </Alert>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField size="small" label={locale === 'th' ? 'ค่าเช่ารายเดือน (บาท)' : 'Monthly Rent (THB)'} required value={formData.monthlyRent} onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })} />
                    <TextField size="small" label={locale === 'th' ? 'อัตราค่าไฟ (บาท/หน่วย)' : 'Electric Rate (THB/unit)'} value={formData.utilityRate} onChange={(e) => setFormData({ ...formData, utilityRate: e.target.value })} />
                    <TextField size="small" label={locale === 'th' ? 'ค่าส่วนกลาง/เดือน' : 'Common Fee/month'} value={formData.commonServiceFee} onChange={(e) => setFormData({ ...formData, commonServiceFee: e.target.value })} />
                    <TextField size="small" label={locale === 'th' ? 'ค่าปรับล่าช้า (%/ปี)' : 'Late Penalty (%/year)'} value={formData.latePenaltyRate} onChange={(e) => setFormData({ ...formData, latePenaltyRate: e.target.value })} />
                  </Box>
                </>
              )}

              {contractType === 'REVENUE_SHARING' && (
                <>
                  <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                    <strong>{locale === 'th' ? 'สัญญาปันผลประโยชน์' : 'Revenue Sharing'}</strong> — {locale === 'th' ? 'MAG หรือ % รายได้ (เลือกที่สูงกว่า)' : 'MAG or % of revenue (whichever higher)'}
                  </Alert>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField size="small" label={locale === 'th' ? 'MAG/เดือน (บาท)' : 'MAG/month (THB)'} required value={formData.magAmount} onChange={(e) => setFormData({ ...formData, magAmount: e.target.value })} />
                    <TextField size="small" label={locale === 'th' ? '% ส่วนแบ่งรายได้' : 'Revenue Share %'} required value={formData.revenueSharePct} onChange={(e) => setFormData({ ...formData, revenueSharePct: e.target.value })} />
                  </Box>
                  {/* Tiered Rate Table */}
                  <Typography sx={{ fontSize: 12, fontWeight: 700, mt: 2, mb: 1, color: '#5a6d80' }}>
                    📐 {locale === 'th' ? 'อัตราแบบขั้นบันได' : 'Tiered Rate'}
                  </Typography>
                  <Table size="small" sx={{ border: '1px solid rgba(22,63,107,.12)', borderRadius: 1 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f4f8fc' }}>
                        <TableCell sx={{ fontSize: 11 }}>{locale === 'th' ? 'ช่วงรายได้/เดือน' : 'Revenue Range/month'}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>% {locale === 'th' ? 'ส่วนแบ่ง' : 'Share'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow><TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>0 — 500,000</TableCell><TableCell>12%</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>500,001 — 1,000,000</TableCell><TableCell>15%</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>1,000,001+</TableCell><TableCell>18%</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </>
              )}

              {contractType === 'CONSIGNMENT' && (
                <>
                  <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                    <strong>{locale === 'th' ? 'สัญญาฝากขาย' : 'Consignment'}</strong> — {locale === 'th' ? 'รับคอมมิชชั่นจากยอดขาย กรรมสิทธิ์ยังเป็นของผู้ฝาก' : 'Commission-based, ownership remains with consigner'}
                  </Alert>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField size="small" label={locale === 'th' ? '% คอมมิชชั่น' : 'Commission %'} required value={formData.commissionPct} onChange={(e) => setFormData({ ...formData, commissionPct: e.target.value })} />
                    <TextField size="small" label={locale === 'th' ? 'คอมมิชชั่นขั้นต่ำ/เดือน' : 'Min Commission/month'} />
                    <TextField size="small" label={locale === 'th' ? 'ค่าพื้นที่จัดแสดง/เดือน' : 'Display Space Fee'} />
                    <Select size="small" defaultValue="souvenir">
                      <MenuItem value="souvenir">{locale === 'th' ? 'ของที่ระลึก / OTOP' : 'Souvenir / OTOP'}</MenuItem>
                      <MenuItem value="food">{locale === 'th' ? 'อาหารและเครื่องดื่ม' : 'Food & Beverage'}</MenuItem>
                      <MenuItem value="brand">{locale === 'th' ? 'สินค้าแบรนด์' : 'Brand Products'}</MenuItem>
                    </Select>
                  </Box>
                </>
              )}

              {contractType === 'REAL_ESTATE' && (
                <>
                  <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                    <strong>{locale === 'th' ? 'สัญญาอสังหาริมทรัพย์' : 'Real Estate'}</strong> — {locale === 'th' ? 'สัญญาเช่าที่ดิน/อาคารในเขตสนามบิน' : 'Lease of land/building in airport area'}
                  </Alert>
                  <RadioGroup defaultValue="LAND_ONLY" row sx={{ mb: 2 }}>
                    <FormControlLabel value="LAND_ONLY" control={<Radio size="small" />} label={locale === 'th' ? '🏞️ ที่ดินอย่างเดียว' : '🏞️ Land only'} />
                    <FormControlLabel value="BUILDING_ONLY" control={<Radio size="small" />} label={locale === 'th' ? '🏢 อาคารอย่างเดียว' : '🏢 Building only'} />
                    <FormControlLabel value="LAND_AND_BUILDING" control={<Radio size="small" />} label={locale === 'th' ? '🏘️ ที่ดินพร้อมอาคาร' : '🏘️ Land + Building'} />
                  </RadioGroup>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
                    <TextField size="small" label={locale === 'th' ? 'ไร่' : 'Rai'} />
                    <TextField size="small" label={locale === 'th' ? 'งาน' : 'Ngan'} />
                    <TextField size="small" label={locale === 'th' ? 'ตร.วา' : 'Sq.Wa'} />
                    <TextField size="small" label={locale === 'th' ? 'ค่าเช่า/เดือน' : 'Monthly Rent'} />
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Step 4: หลักประกันและเอกสาร */}
          {currentStep === 4 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>attach_money</span>
                {locale === 'th' ? 'หลักประกันและเอกสาร' : 'Deposit & Documents'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Select size="small" value={formData.depositType} onChange={(e) => setFormData({ ...formData, depositType: e.target.value })}>
                  <MenuItem value="CASH">{locale === 'th' ? 'เงินสด' : 'Cash'}</MenuItem>
                  <MenuItem value="BANK_GUARANTEE">{locale === 'th' ? 'หนังสือค้ำประกันธนาคาร' : 'Bank Guarantee'}</MenuItem>
                  <MenuItem value="CHEQUE">{locale === 'th' ? 'เช็ค' : 'Cheque'}</MenuItem>
                </Select>
                <TextField size="small" label={locale === 'th' ? 'จำนวนเงินประกัน (บาท)' : 'Deposit Amount (THB)'} value={formData.depositAmount} onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })} helperText={locale === 'th' ? 'คำนวณจากค่าเช่า 3 เดือน' : 'Calculated as 3 months rent'} />
              </Box>

              {/* Upload เอกสาร — ดึงรายการเอกสารจาก master data */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#5a6d80', mb: 1, textTransform: 'uppercase', letterSpacing: .5 }}>
                {locale === 'th' ? '📎 เอกสารประกอบ' : '📎 Supporting Documents'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {docTypes.filter((d) => d.isActive).map((doc) => {
                  const uploaded = uploadedDocs[doc.id];
                  return (
                    <Box
                      key={doc.id}
                      sx={{
                        p: 1.5, borderRadius: 1,
                        border: `1px dashed ${uploaded ? '#0f7a43' : doc.required ? 'rgba(217,83,79,.3)' : 'rgba(22,63,107,.25)'}`,
                        bgcolor: uploaded ? 'rgba(26,158,92,.04)' : undefined,
                        display: 'flex', alignItems: 'center', gap: 1,
                      }}
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 22, color: uploaded ? '#0f7a43' : doc.required ? '#b52822' : '#5a6d80' }}>
                        {uploaded ? 'check_circle' : 'upload_file'}
                      </span>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12 }}>
                          {locale === 'th' ? doc.nameTh : (doc.nameEn || doc.nameTh)}
                          {doc.required && <span style={{ color: '#b52822', marginLeft: 4 }}>*</span>}
                        </Typography>
                        {uploaded && (
                          <Typography sx={{ fontSize: 9, color: '#0f7a43', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ✓ {uploaded.filename}
                          </Typography>
                        )}
                      </Box>
                      <Button size="small" variant="outlined" component="label" sx={{ fontSize: 10 }}>
                        {uploaded ? (locale === 'th' ? 'เปลี่ยน' : 'Replace') : (locale === 'th' ? 'เลือกไฟล์' : 'Choose')}
                        <input
                          type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload(doc.id, file);
                          }}
                        />
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Step 5: Preview สัญญา */}
          {currentStep === 5 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#005b9f' }}>preview</span>
                {locale === 'th' ? 'ตรวจสอบร่างสัญญา' : 'Contract Preview'}
              </Typography>
              <Alert severity="success" sx={{ mb: 2, fontSize: 12 }}>
                {locale === 'th' ? '✓ ข้อมูลครบถ้วน พร้อมสร้างเอกสารสัญญา' : '✓ Information complete, ready to generate contract'}
              </Alert>

              {/* Contract Summary */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: '#fafbfc', border: '1px dashed rgba(22,63,107,.2)', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, textAlign: 'center', mb: .5 }}>
                  {locale === 'th' ? 'สัญญาเช่าพื้นที่เชิงพาณิชย์' : 'Commercial Lease Contract'}
                </Typography>
                <Typography sx={{ fontSize: 11, textAlign: 'center', color: '#5a6d80', mb: 2 }}>
                  {locale === 'th' ? 'ท่าอากาศยานดอนเมือง · กรมท่าอากาศยาน' : 'Don Mueang Airport · Department of Airports'}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, fontSize: 12 }}>
                  {[
                    [locale === 'th' ? 'เลขสัญญา' : 'Contract No.', createdContractNo || (locale === 'th' ? '(สร้างเมื่อบันทึก)' : '(generated on save)')],
                    [locale === 'th' ? 'ประเภทสัญญา' : 'Type', contractTypes.find((c) => c.value === contractType)?.[locale === 'th' ? 'labelTh' : 'labelEn'] || ''],
                    [locale === 'th' ? 'ผู้ให้เช่า' : 'Lessor', locale === 'th' ? 'กรมท่าอากาศยาน' : 'Department of Airports'],
                    [locale === 'th' ? 'ผู้เช่า' : 'Lessee', formData.tenantName],
                    [locale === 'th' ? 'เลขภาษี' : 'Tax ID', formData.taxId],
                    [locale === 'th' ? 'พื้นที่เช่า' : 'Unit', `${formData.unitCode} (${formData.areaSqm} ${locale === 'th' ? 'ตร.ม.' : 'sqm'})`],
                    [locale === 'th' ? 'วัตถุประสงค์' : 'Purpose', formData.purpose],
                    [locale === 'th' ? 'ระยะสัญญา' : 'Duration', `${formData.startDate} — ${formData.endDate}`],
                    ...(contractType === 'FIXED_RENT' ? [[locale === 'th' ? 'ค่าเช่ารายเดือน' : 'Monthly Rent', `฿${Number(formData.monthlyRent).toLocaleString()}`]] : []),
                    ...(contractType === 'REVENUE_SHARING' ? [[locale === 'th' ? 'MAG' : 'MAG', `฿${Number(formData.magAmount).toLocaleString()}`], [locale === 'th' ? '% ส่วนแบ่ง' : 'Share', `${formData.revenueSharePct}%`]] : []),
                    [locale === 'th' ? 'ค่ามัดจำ' : 'Deposit', `฿${Number(formData.depositAmount).toLocaleString()}`],
                    [locale === 'th' ? 'ค่าปรับล่าช้า' : 'Late Penalty', `${formData.latePenaltyRate}%/${locale === 'th' ? 'ปี' : 'year'}`],
                  ].map(([label, value], i) => (
                    <Box key={i} sx={{ display: 'contents' }}>
                      <Typography sx={{ fontSize: 12, color: '#5a6d80' }}>{label}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />
                <Typography sx={{ fontSize: 11, color: '#5a6d80', fontStyle: 'italic', textAlign: 'center' }}>
                  {locale === 'th' ? 'ร่างสัญญาจะถูกสร้างเป็น PDF หลังจากคลิก "ลงนาม"' : 'Full contract PDF will be generated after clicking "Sign"'}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Step 6: ลงนาม/ดาวน์โหลด */}
          {currentStep === 6 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(26,158,92,.1)', border: '3px solid #0f7a43', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <span className="material-icons-outlined" style={{ fontSize: 48, color: '#0f7a43' }}>check_circle</span>
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0f7a43', mb: 1 }}>
                {locale === 'th' ? 'สร้างสัญญาเรียบร้อย!' : 'Contract Created Successfully!'}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#5a6d80', mb: 3 }}>
                {locale === 'th' ? 'สัญญาอยู่ในสถานะรออนุมัติจากหัวหน้า' : 'Contract is pending supervisor approval'}
              </Typography>

              <Chip label={createdContractNo || 'CTR-XXXX-XXX'} sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: '#005b9f', bgcolor: 'rgba(0,91,159,.08)', border: '1px solid rgba(0,91,159,.25)', py: 2, px: 1, mb: 3 }} />

              {/* Workflow Progress */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                {[
                  { step: 1, label: locale === 'th' ? 'เจ้าหน้าที่บันทึก' : 'Officer Saved', status: 'done' },
                  { step: 2, label: locale === 'th' ? 'หัวหน้าตรวจสอบ' : 'Supervisor Review', status: 'active' },
                  { step: 3, label: locale === 'th' ? 'ผอ.อนุมัติ' : 'Director Approve', status: 'pending' },
                  { step: 4, label: locale === 'th' ? 'ฝ่ายกฎหมาย' : 'Legal Review', status: 'pending' },
                  { step: 5, label: locale === 'th' ? 'ลงนาม' : 'Sign', status: 'pending' },
                  { step: 6, label: locale === 'th' ? 'มีผลบังคับ' : 'Active', status: 'pending' },
                ].map((s) => (
                  <Chip
                    key={s.step}
                    label={`${s.step}. ${s.label}`}
                    size="small"
                    sx={{
                      fontSize: 10, fontWeight: 600,
                      bgcolor: s.status === 'done' ? 'rgba(26,158,92,.1)' : s.status === 'active' ? 'rgba(217,119,6,.1)' : '#f4f8fc',
                      color: s.status === 'done' ? '#0f7a43' : s.status === 'active' ? '#a45a00' : '#5a6d80',
                      border: `1px solid ${s.status === 'done' ? '#0f7a43' : s.status === 'active' ? '#a45a00' : 'rgba(22,63,107,.12)'}`,
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained" size="large"
                  onClick={() => {
                    const rows: [string, string][] = [
                      ['เลขสัญญา / Contract No.', createdContractNo || 'CTR-XXXX-XXX'],
                      ['ประเภทสัญญา / Type', contractType],
                      ['ผู้ให้เช่า / Lessor', 'กรมท่าอากาศยาน'],
                      ['ผู้เช่า / Lessee', formData.tenantName],
                      ['เลขภาษี / Tax ID', formData.taxId],
                      ['พื้นที่เช่า / Unit', `${formData.unitCode} (${formData.areaSqm} sqm)`],
                      ['วัตถุประสงค์ / Purpose', formData.purpose],
                      ['วันที่เริ่ม / Start', formData.startDate],
                      ['วันที่สิ้นสุด / End', formData.endDate],
                      ['ค่าเช่ารายเดือน / Monthly Rent', `THB ${Number(formData.monthlyRent).toLocaleString()}`],
                      ['ค่ามัดจำ / Deposit', `THB ${Number(formData.depositAmount).toLocaleString()}`],
                      ['ค่าปรับล่าช้า / Late Penalty', `${formData.latePenaltyRate}% / year`],
                    ];
                    generateSimplePdf('Commercial Lease Contract / สัญญาเช่า', rows, `${createdContractNo || 'contract'}.pdf`);
                  }}
                >
                  <span className="material-icons-outlined" style={{ fontSize: 18, marginRight: 6 }}>picture_as_pdf</span>
                  {locale === 'th' ? 'ดาวน์โหลด PDF' : 'Download PDF'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/contracts')}>
                  {locale === 'th' ? 'กลับสู่รายการสัญญา' : 'Back to Contract List'}
                </Button>
              </Box>
            </Box>
          )}

          {/* แสดง error จาก API */}
          {saveError && (
            <Alert severity="error" sx={{ mt: 2, fontSize: 12 }}>
              {saveError}
            </Alert>
          )}

          {/* ปุ่ม Navigation */}
          {currentStep < 6 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid rgba(22,63,107,.08)' }}>
              <Button variant="outlined" disabled={currentStep === 1 || saving} onClick={goBack}>
                ← {t('common.back')}
              </Button>
              <Button
                variant="contained"
                disabled={saving}
                onClick={currentStep === 5 ? handleSaveContract : goNext}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                    {locale === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {currentStep === 5 ? (locale === 'th' ? '✍️ ลงนามและบันทึก' : '✍️ Sign & Save') : t('common.next')} →
                  </>
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
}
