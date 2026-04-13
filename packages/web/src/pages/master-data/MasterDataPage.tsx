import { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { useTranslation } from '../../lib/i18n';
import OrganizationTab from './tabs/OrganizationTab';
import ZoneTypeTab from './tabs/ZoneTypeTab';
import BusinessCategoryTab from './tabs/BusinessCategoryTab';
import PaymentMethodTab from './tabs/PaymentMethodTab';
import DocumentTypeTab from './tabs/DocumentTypeTab';
import DepartmentTab from './tabs/DepartmentTab';

// === หน้ารวม Master Data — แบ่งเป็น tabs แต่ละประเภท ===
export default function MasterDataPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState(0);

  const tabs = [
    { labelTh: 'หน่วยงาน', labelEn: 'Organization', icon: 'business', component: <OrganizationTab /> },
    { labelTh: 'ประเภทโซน', labelEn: 'Zone Types', icon: 'category', component: <ZoneTypeTab /> },
    { labelTh: 'หมวดหมู่ธุรกิจ', labelEn: 'Business Categories', icon: 'storefront', component: <BusinessCategoryTab /> },
    { labelTh: 'วิธีชำระเงิน', labelEn: 'Payment Methods', icon: 'payments', component: <PaymentMethodTab /> },
    { labelTh: 'ประเภทเอกสาร', labelEn: 'Document Types', icon: 'description', component: <DocumentTypeTab /> },
    { labelTh: 'แผนก/ฝ่าย', labelEn: 'Departments', icon: 'groups', component: <DepartmentTab /> },
  ];

  return (
    <>
      <PageHeader
        icon="🗂️"
        title={locale === 'th' ? 'ข้อมูลหลัก (Master Data)' : 'Master Data'}
        subtitle={locale === 'th' ? 'ตั้งค่าข้อมูลหลักของระบบ — หน่วยงาน, dropdown, ประเภทต่างๆ' : 'Configure system master data — organizations, dropdowns, types'}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tabs */}
        <Paper elevation={0} sx={{ borderBottom: '1px solid rgba(22,63,107,.12)', bgcolor: '#fff' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48, textTransform: 'none', fontSize: 12.5, fontWeight: 600,
                gap: .5, color: '#6c7f92',
                '&.Mui-selected': { color: '#005b9f' },
              },
            }}
          >
            {tabs.map((t, i) => (
              <Tab
                key={i}
                icon={<span className="material-icons-outlined" style={{ fontSize: 18 }}>{t.icon}</span>}
                iconPosition="start"
                label={locale === 'th' ? t.labelTh : t.labelEn}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, md: 2.75 } }}>
          {tabs[tab].component}
        </Box>
      </Box>
    </>
  );
}
