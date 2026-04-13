import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ประเภทภาษาที่รองรับ
export type Locale = 'th' | 'en';

// ไฟล์แปลภาษา — เพิ่มคำแปลได้ตรงนี้
const translations: Record<Locale, Record<string, string>> = {
  th: {
    // === Topbar ===
    'app.title': 'ระบบบริหารสัญญาเช่าพื้นที่เชิงพาณิชย์',
    'app.subtitle': 'กรมท่าอากาศยาน · Department of Airports · DOA',
    'app.adminMode': 'โหมดเจ้าหน้าที่',
    'app.tenantMode': 'Portal ผู้เช่า',
    'topbar.officer': '🏢 เจ้าหน้าที่',
    'topbar.tenant': '👤 Portal ผู้เช่า',

    // === Sidebar ===
    'nav.overview': 'ภาพรวม',
    'nav.dashboard': 'Dashboard รายรับ',
    'nav.commercial': 'พื้นที่เชิงพาณิชย์',
    'nav.floorplan': 'แผนผังพื้นที่ (Floor Plan)',
    'nav.floorplanEditor': 'แผนผัง — อัปโหลด/กำหนดพื้นที่',
    'nav.units': 'รายการพื้นที่เช่า',
    'nav.contracts': 'สัญญาเช่า',
    'nav.contractList': 'รายการสัญญา',
    'nav.contractCreate': 'สร้างสัญญาใหม่',
    'nav.contractRenew': 'ต่ออายุสัญญา',
    'nav.tenants': 'ผู้เช่า / คู่ค้า',
    'nav.partnerMaster': 'ฐานข้อมูลผู้เช่า',
    'nav.finance': 'การเงิน',
    'nav.billing': 'ใบชำระค่าเช่า',
    'nav.receipt': 'ใบเสร็จรับเงิน',
    'nav.reports': 'รายงาน',
    'nav.reportRevenue': 'รายงานรายได้',
    'nav.reportArea': 'วิเคราะห์พื้นที่',
    'nav.data': 'ข้อมูล',
    'nav.importExport': 'นำเข้า/ส่งออกข้อมูล',
    'nav.dataCleansing': 'ตรวจสอบคุณภาพข้อมูล',
    'nav.system': 'ระบบ',
    'nav.template': 'Template เอกสาร',
    'nav.settings': 'ตั้งค่าระบบ',

    // === Dashboard ===
    'dashboard.title': 'Dashboard ภาพรวมรายรับ',
    'dashboard.subtitle': 'อัปเดตล่าสุด',
    'dashboard.totalUnits': 'พื้นที่ทั้งหมด (ยูนิต)',
    'dashboard.leasedUnits': 'พื้นที่เช่าแล้ว',
    'dashboard.vacantUnits': 'พื้นที่ว่าง',
    'dashboard.reserved': 'รอทำสัญญา',
    'dashboard.monthlyRevenue': 'รายรับเดือนนี้ (บาท)',
    'dashboard.occupancyRate': 'อัตราการเช่า',
    'dashboard.revenueChart': 'รายรับค่าเช่ารายเดือน (บาท)',
    'dashboard.forecastVsActual': 'เปรียบเทียบประมาณการ vs จริง',
    'dashboard.expiringContracts': 'สัญญาใกล้หมดอายุ',
    'dashboard.within90days': 'ภายใน 90 วัน · ต้องดำเนินการต่อสัญญา',
    'dashboard.revenueSplit': 'การแบ่งรายได้ (เดือนนี้)',
    'dashboard.paymentStatus': 'สถานะชำระค่าเช่า',
    'dashboard.contractSummary': 'สรุปสัญญาเช่า',
    'dashboard.forecast': 'ประมาณการ',
    'dashboard.actual': 'จริง',
    'dashboard.exportExcel': '⬇ ส่งออก Excel',
    'dashboard.print': '🖨 พิมพ์รายงาน',

    // === Floor Plan ===
    'floorplan.title': 'แผนผังพื้นที่เชิงพาณิชย์',
    'floorplan.subtitle': 'คลิกที่โซนเพื่อดูรายละเอียด',
    'floorplan.vacant': 'ว่าง',
    'floorplan.leased': 'เช่าแล้ว',
    'floorplan.reserved': 'จอง/รอทำสัญญา',
    'floorplan.overdue': 'ค้างชำระ/ใกล้หมดอายุ',
    'floorplan.maintenance': 'ปิดปรับปรุง',
    'floorplan.selectAirport': 'เลือกท่าอากาศยาน',
    'floorplan.selectFloor': 'เลือกชั้น',
    'floorplan.zoneInfo': 'รายละเอียดโซน',
    'floorplan.tenant': 'ผู้เช่า',
    'floorplan.shopName': 'ชื่อร้าน',
    'floorplan.contract': 'เลขสัญญา',
    'floorplan.area': 'พื้นที่',
    'floorplan.rent': 'ค่าเช่า/เดือน',
    'floorplan.daysLeft': 'เหลืออีก',
    'floorplan.days': 'วัน',
    'floorplan.sqm': 'ตร.ม.',

    // === Units ===
    'units.title': 'รายการพื้นที่เช่า',
    'units.subtitle': 'จัดการพื้นที่เชิงพาณิชย์ทั้งหมด',
    'units.search': 'ค้นหาด้วยรหัสหรือชื่อ...',
    'units.addUnit': '+ เพิ่มพื้นที่',
    'units.unitCode': 'รหัสพื้นที่',
    'units.unitName': 'ชื่อพื้นที่',
    'units.zone': 'โซน',
    'units.areaSqm': 'พื้นที่ (ตร.ม.)',
    'units.status': 'สถานะ',
    'units.currentTenant': 'ผู้เช่าปัจจุบัน',
    'units.purpose': 'วัตถุประสงค์',
    'units.actions': 'จัดการ',

    // === Partners ===
    'partners.title': 'ฐานข้อมูลผู้เช่า',
    'partners.subtitle': 'จัดการข้อมูลผู้เช่าและคู่ค้า',
    'partners.search': 'ค้นหาด้วยชื่อ, เลขภาษี...',
    'partners.addPartner': '+ เพิ่มผู้เช่า',
    'partners.code': 'รหัส',
    'partners.name': 'ชื่อผู้เช่า/นิติบุคคล',
    'partners.shopName': 'ชื่อร้าน',
    'partners.taxId': 'เลขภาษี',
    'partners.contact': 'ผู้ติดต่อ',
    'partners.phone': 'โทรศัพท์',
    'partners.contracts': 'สัญญา',
    'partners.type': 'ประเภท',
    'partners.individual': 'บุคคลธรรมดา',
    'partners.juristic': 'นิติบุคคล',

    // === สถานะ ===
    'status.vacant': 'ว่าง',
    'status.leased': 'เช่าแล้ว',
    'status.reserved': 'จองแล้ว',
    'status.maintenance': 'ปิดปรับปรุง',
    'status.active': 'มีผลบังคับ',
    'status.expired': 'หมดอายุ',
    'status.draft': 'ร่าง',
    'status.paid': 'ชำระแล้ว',
    'status.overdue': 'เกินกำหนด',
    'status.pending': 'รอชำระ',

    // === ทั่วไป ===
    'common.all': 'ทั้งหมด',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.close': 'ปิด',
    'common.confirm': 'ยืนยัน',
    'common.back': 'ย้อนกลับ',
    'common.next': 'ถัดไป',
    'common.loading': 'กำลังโหลด...',
    'common.noData': 'ไม่มีข้อมูล',
    'common.manage': 'จัดการ',
    'common.viewAll': 'ดูทั้งหมด',
    'common.baht': 'บาท',
    'common.perMonth': '/เดือน',
    'common.urgent': 'เร่งด่วน',
    'common.approaching': 'ใกล้ถึง',
    'common.normal': 'ปกติ',
    'common.ofTotal': 'ของทั้งหมด',
    'common.fromLastMonth': 'จากเดือนก่อน',

    // === สัญญา ===
    'contract.fixedRent': 'ค่าเช่าคงที่',
    'contract.revenueSharing': 'ปันผลประโยชน์',
    'contract.consignment': 'ฝากขาย',
    'contract.realEstate': 'อสังหาริมทรัพย์',
    'contract.allContracts': 'สัญญาทั้งหมด',

    // === การเงิน ===
    'finance.treasury': 'กรมธนารักษ์',
    'finance.welfareFund': 'กองทุนสวัสดิการ ทย.',
    'finance.revolvingFund': 'เงินทุนหมุนเวียน ทย.',
  },

  en: {
    // === Topbar ===
    'app.title': 'Commercial Lease Management System',
    'app.subtitle': 'Department of Airports · DOA',
    'app.adminMode': 'Admin Mode',
    'app.tenantMode': 'Tenant Portal',
    'topbar.officer': '🏢 Officer',
    'topbar.tenant': '👤 Tenant Portal',

    // === Sidebar ===
    'nav.overview': 'Overview',
    'nav.dashboard': 'Revenue Dashboard',
    'nav.commercial': 'Commercial Area',
    'nav.floorplan': 'Floor Plan',
    'nav.floorplanEditor': 'Floor Plan — Upload/Draw',
    'nav.units': 'Rental Units',
    'nav.contracts': 'Lease Contracts',
    'nav.contractList': 'Contract List',
    'nav.contractCreate': 'Create Contract',
    'nav.contractRenew': 'Renew Contract',
    'nav.tenants': 'Tenants / Partners',
    'nav.partnerMaster': 'Tenant Database',
    'nav.finance': 'Finance',
    'nav.billing': 'Billing',
    'nav.receipt': 'Receipts',
    'nav.reports': 'Reports',
    'nav.reportRevenue': 'Revenue Report',
    'nav.reportArea': 'Area Analysis',
    'nav.data': 'Data',
    'nav.importExport': 'Import/Export Data',
    'nav.dataCleansing': 'Data Quality Check',
    'nav.system': 'System',
    'nav.template': 'Document Templates',
    'nav.settings': 'System Settings',

    // === Dashboard ===
    'dashboard.title': 'Revenue Dashboard',
    'dashboard.subtitle': 'Last updated',
    'dashboard.totalUnits': 'Total Units',
    'dashboard.leasedUnits': 'Leased Units',
    'dashboard.vacantUnits': 'Vacant Units',
    'dashboard.reserved': 'Pending Contract',
    'dashboard.monthlyRevenue': 'Monthly Revenue (THB)',
    'dashboard.occupancyRate': 'Occupancy Rate',
    'dashboard.revenueChart': 'Monthly Rental Revenue (THB)',
    'dashboard.forecastVsActual': 'Forecast vs Actual',
    'dashboard.expiringContracts': 'Expiring Contracts',
    'dashboard.within90days': 'Within 90 days · Action required',
    'dashboard.revenueSplit': 'Revenue Split (This Month)',
    'dashboard.paymentStatus': 'Payment Status',
    'dashboard.contractSummary': 'Contract Summary',
    'dashboard.forecast': 'Forecast',
    'dashboard.actual': 'Actual',
    'dashboard.exportExcel': '⬇ Export Excel',
    'dashboard.print': '🖨 Print Report',

    // === Floor Plan ===
    'floorplan.title': 'Commercial Floor Plan',
    'floorplan.subtitle': 'Click on a zone for details',
    'floorplan.vacant': 'Vacant',
    'floorplan.leased': 'Leased',
    'floorplan.reserved': 'Reserved / Pending',
    'floorplan.overdue': 'Overdue / Expiring',
    'floorplan.maintenance': 'Maintenance',
    'floorplan.selectAirport': 'Select Airport',
    'floorplan.selectFloor': 'Select Floor',
    'floorplan.zoneInfo': 'Zone Details',
    'floorplan.tenant': 'Tenant',
    'floorplan.shopName': 'Shop Name',
    'floorplan.contract': 'Contract No.',
    'floorplan.area': 'Area',
    'floorplan.rent': 'Monthly Rent',
    'floorplan.daysLeft': 'Days Left',
    'floorplan.days': 'days',
    'floorplan.sqm': 'sq.m.',

    // === Units ===
    'units.title': 'Rental Units',
    'units.subtitle': 'Manage all commercial rental spaces',
    'units.search': 'Search by code or name...',
    'units.addUnit': '+ Add Unit',
    'units.unitCode': 'Unit Code',
    'units.unitName': 'Unit Name',
    'units.zone': 'Zone',
    'units.areaSqm': 'Area (sq.m.)',
    'units.status': 'Status',
    'units.currentTenant': 'Current Tenant',
    'units.purpose': 'Purpose',
    'units.actions': 'Actions',

    // === Partners ===
    'partners.title': 'Tenant Database',
    'partners.subtitle': 'Manage tenants and business partners',
    'partners.search': 'Search by name, tax ID...',
    'partners.addPartner': '+ Add Tenant',
    'partners.code': 'Code',
    'partners.name': 'Tenant / Company Name',
    'partners.shopName': 'Shop Name',
    'partners.taxId': 'Tax ID',
    'partners.contact': 'Contact Person',
    'partners.phone': 'Phone',
    'partners.contracts': 'Contracts',
    'partners.type': 'Type',
    'partners.individual': 'Individual',
    'partners.juristic': 'Juristic Person',

    // === สถานะ ===
    'status.vacant': 'Vacant',
    'status.leased': 'Leased',
    'status.reserved': 'Reserved',
    'status.maintenance': 'Maintenance',
    'status.active': 'Active',
    'status.expired': 'Expired',
    'status.draft': 'Draft',
    'status.paid': 'Paid',
    'status.overdue': 'Overdue',
    'status.pending': 'Pending',

    // === ทั่วไป ===
    'common.all': 'All',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.manage': 'Manage',
    'common.viewAll': 'View All',
    'common.baht': 'THB',
    'common.perMonth': '/month',
    'common.urgent': 'Urgent',
    'common.approaching': 'Approaching',
    'common.normal': 'Normal',
    'common.ofTotal': 'of total',
    'common.fromLastMonth': 'from last month',

    // === สัญญา ===
    'contract.fixedRent': 'Fixed Rent',
    'contract.revenueSharing': 'Revenue Sharing',
    'contract.consignment': 'Consignment',
    'contract.realEstate': 'Real Estate',
    'contract.allContracts': 'All Contracts',

    // === การเงิน ===
    'finance.treasury': 'Treasury Department',
    'finance.welfareFund': 'DOA Welfare Fund',
    'finance.revolvingFund': 'DOA Revolving Fund',
  },
};

// Zustand store สำหรับจัดการภาษา
interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'th',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'doa-locale' }
  )
);

// Hook สำหรับดึงคำแปล — ใช้ t('key') ในทุก component
export function useTranslation() {
  const { locale, setLocale } = useI18nStore();

  const t = (key: string, fallback?: string): string => {
    return translations[locale][key] || fallback || key;
  };

  return { t, locale, setLocale };
}
