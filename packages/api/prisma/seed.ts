import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 เริ่มเพิ่มข้อมูลตั้งต้น...');

  // === หน่วยงาน / Organization ===
  await prisma.tmOrganization.createMany({
    data: [
      {
        orgCode: 'DOA',
        nameTh: 'กรมท่าอากาศยาน',
        nameEn: 'Department of Airports',
        shortNameTh: 'ทย.',
        shortNameEn: 'DOA',
        taxId: '0994000165510',
        addressTh: '71 ซอยงามดูพลี ถ.พระราม 4 แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120',
        addressEn: '71 Soi Ngam Dupli, Rama 4 Rd, Thungmahamek, Sathon, Bangkok 10120',
        phone: '02-287-0320',
        email: 'info@airports.go.th',
        website: 'https://www.airports.go.th',
        treasuryPct: 50,
        welfareFundPct: 20,
        revolvingFundPct: 30,
        isDefault: true,
      },
      {
        orgCode: 'AOT',
        nameTh: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',
        nameEn: 'Airports of Thailand PCL',
        shortNameTh: 'ทอท.',
        shortNameEn: 'AOT',
        taxId: '0107545000365',
        phone: '02-535-1111',
        email: 'info@airportthai.co.th',
        treasuryPct: 0,
        welfareFundPct: 0,
        revolvingFundPct: 100,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // === ประเภทโซน ===
  // === สถานะการจัดสรรพื้นที่ (Allocation Status) — ใช้ใน Floor Plan booking ===
  await prisma.tmAllocationStatus.createMany({
    data: [
      { code: 'OPEN_RENT',   nameTh: 'ปล่อยให้เช่า',      nameEn: 'Open for Rent',   mapsTo: 'VACANT',      icon: 'lock_open',    color: '#0f7a43', description: 'พร้อมให้เช่าทั่วไป', sortOrder: 1 },
      { code: 'RESERVED',    nameTh: 'สงวนพื้นที่',       nameEn: 'Reserved',        mapsTo: 'RESERVED',    icon: 'bookmark',     color: '#a45a00', description: 'จองไว้ / รอทำสัญญา', sortOrder: 2 },
      { code: 'LEASED',      nameTh: 'เช่าแล้ว',          nameEn: 'Leased',          mapsTo: 'LEASED',      icon: 'handshake',    color: '#005b9f', description: 'มีสัญญาเช่า active', sortOrder: 3 },
      { code: 'MAINTENANCE', nameTh: 'ปิดปรับปรุง',        nameEn: 'Maintenance',     mapsTo: 'MAINTENANCE', icon: 'construction', color: '#5a6d80', description: 'ปิดชั่วคราว ซ่อมแซม', sortOrder: 4 },
      { code: 'INTERNAL',    nameTh: 'ใช้ภายในหน่วยงาน',  nameEn: 'Internal Use',    mapsTo: 'RESERVED',    icon: 'corporate_fare', color: '#7c3aed', description: 'สงวนไว้ใช้ภายในกรม', sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  await prisma.tmZoneType.createMany({
    data: [
      { code: 'BOOTH', nameTh: 'คูหา', nameEn: 'Booth', icon: 'storefront', color: '#005b9f', defaultRate: 3500, sortOrder: 1 },
      { code: 'RETAIL', nameTh: 'ร้านค้าปลีก', nameEn: 'Retail', icon: 'shopping_bag', color: '#1a9e5c', defaultRate: 4500, sortOrder: 2 },
      { code: 'FOOD', nameTh: 'ร้านอาหาร / เครื่องดื่ม', nameEn: 'Food & Beverage', icon: 'restaurant', color: '#d97706', defaultRate: 5500, sortOrder: 3 },
      { code: 'EVENT', nameTh: 'พื้นที่กิจกรรม', nameEn: 'Event Space', icon: 'celebration', color: '#7c3aed', defaultRate: 2500, sortOrder: 4 },
      { code: 'LOUNGE', nameTh: 'Lounge / พักผ่อน', nameEn: 'Lounge', icon: 'weekend', color: '#0f73b8', defaultRate: 6000, sortOrder: 5 },
      { code: 'SERVICE', nameTh: 'พื้นที่บริการ', nameEn: 'Service Area', icon: 'room_service', color: '#6c7f92', defaultRate: 2000, sortOrder: 6 },
      { code: 'ATM', nameTh: 'ตู้ ATM / อัตโนมัติ', nameEn: 'ATM / Automated', icon: 'local_atm', color: '#d97706', defaultRate: 8000, sortOrder: 7 },
      { code: 'ADVERT', nameTh: 'พื้นที่โฆษณา', nameEn: 'Advertising', icon: 'campaign', color: '#d9534f', defaultRate: 12000, sortOrder: 8 },
    ],
    skipDuplicates: true,
  });

  // === หมวดหมู่ธุรกิจ ===
  await prisma.tmBusinessCategory.createMany({
    data: [
      { code: 'RESTAURANT', nameTh: 'ร้านอาหาร', nameEn: 'Restaurant', icon: 'restaurant', sortOrder: 1 },
      { code: 'COFFEE', nameTh: 'ร้านกาแฟ', nameEn: 'Coffee Shop', icon: 'coffee', sortOrder: 2 },
      { code: 'FASTFOOD', nameTh: 'อาหารจานด่วน', nameEn: 'Fast Food', icon: 'fastfood', sortOrder: 3 },
      { code: 'RETAIL_GEN', nameTh: 'ร้านค้าปลีก', nameEn: 'Retail', icon: 'shopping_bag', sortOrder: 4 },
      { code: 'SOUVENIR', nameTh: 'ของที่ระลึก / OTOP', nameEn: 'Souvenir / OTOP', icon: 'card_giftcard', sortOrder: 5 },
      { code: 'PHARMACY', nameTh: 'ร้านยา', nameEn: 'Pharmacy', icon: 'local_pharmacy', sortOrder: 6 },
      { code: 'COSMETIC', nameTh: 'เครื่องสำอาง / ความงาม', nameEn: 'Cosmetics & Beauty', icon: 'face', sortOrder: 7 },
      { code: 'BOOKSTORE', nameTh: 'ร้านหนังสือ', nameEn: 'Bookstore', icon: 'menu_book', sortOrder: 8 },
      { code: 'CONVENIENCE', nameTh: 'ร้านสะดวกซื้อ', nameEn: 'Convenience Store', icon: 'local_convenience_store', sortOrder: 9 },
      { code: 'DUTY_FREE', nameTh: 'ดิวตี้ฟรี', nameEn: 'Duty Free', icon: 'luggage', sortOrder: 10 },
      { code: 'TECH', nameTh: 'อิเล็กทรอนิกส์', nameEn: 'Electronics', icon: 'devices', sortOrder: 11 },
      { code: 'CLOTHING', nameTh: 'เสื้อผ้า / แฟชั่น', nameEn: 'Fashion', icon: 'checkroom', sortOrder: 12 },
      { code: 'SERVICES', nameTh: 'บริการ', nameEn: 'Services', icon: 'room_service', sortOrder: 13 },
      { code: 'OTHER', nameTh: 'อื่นๆ', nameEn: 'Other', icon: 'more_horiz', sortOrder: 99 },
    ],
    skipDuplicates: true,
  });

  // === วิธีการชำระเงิน ===
  await prisma.tmPaymentMethod.createMany({
    data: [
      { code: 'CASH', nameTh: 'เงินสด', nameEn: 'Cash', icon: 'payments', requiresRef: false, sortOrder: 1 },
      { code: 'TRANSFER', nameTh: 'โอนผ่านธนาคาร', nameEn: 'Bank Transfer', icon: 'account_balance', requiresRef: true, sortOrder: 2 },
      { code: 'QR_CODE', nameTh: 'QR PromptPay', nameEn: 'QR PromptPay', icon: 'qr_code_2', requiresRef: true, sortOrder: 3 },
      { code: 'CHEQUE', nameTh: 'เช็ค', nameEn: 'Cheque', icon: 'receipt_long', requiresRef: true, sortOrder: 4 },
      { code: 'CREDIT_CARD', nameTh: 'บัตรเครดิต', nameEn: 'Credit Card', icon: 'credit_card', requiresRef: true, sortOrder: 5 },
      { code: 'DEBIT_CARD', nameTh: 'บัตรเดบิต', nameEn: 'Debit Card', icon: 'credit_card', requiresRef: true, sortOrder: 6 },
    ],
    skipDuplicates: true,
  });

  // === ประเภทเอกสาร ===
  await prisma.tmDocumentType.createMany({
    data: [
      { code: 'ID_CARD', nameTh: 'สำเนาบัตรประชาชน', nameEn: 'ID Card Copy', required: true, forPartner: true, forJuristic: true, sortOrder: 1 },
      { code: 'HOUSE_REG', nameTh: 'สำเนาทะเบียนบ้าน', nameEn: 'House Registration', required: true, forPartner: true, forJuristic: false, sortOrder: 2 },
      { code: 'COMPANY_CERT', nameTh: 'หนังสือรับรองบริษัท', nameEn: 'Company Certificate', required: true, forPartner: false, forJuristic: true, sortOrder: 3 },
      { code: 'VAT_CERT', nameTh: 'ภ.พ.20', nameEn: 'VAT Registration', required: true, forPartner: false, forJuristic: true, sortOrder: 4 },
      { code: 'POWER_ATTORNEY', nameTh: 'หนังสือมอบอำนาจ', nameEn: 'Power of Attorney', required: false, forPartner: true, forJuristic: true, sortOrder: 5 },
      { code: 'SHAREHOLDER', nameTh: 'บัญชีรายชื่อผู้ถือหุ้น', nameEn: 'Shareholder List', required: false, forPartner: false, forJuristic: true, sortOrder: 6 },
      { code: 'MEMORANDUM', nameTh: 'หนังสือบริคณห์สนธิ', nameEn: 'Memorandum', required: false, forPartner: false, forJuristic: true, sortOrder: 7 },
      { code: 'BANK_GUARANTEE', nameTh: 'หนังสือค้ำประกันธนาคาร', nameEn: 'Bank Guarantee Letter', required: false, forPartner: true, forJuristic: true, sortOrder: 8 },
      { code: 'FINANCIAL', nameTh: 'งบการเงิน', nameEn: 'Financial Statement', required: false, forPartner: false, forJuristic: true, sortOrder: 9 },
    ],
    skipDuplicates: true,
  });

  // === แผนก / ฝ่าย ===
  await prisma.tmDepartment.createMany({
    data: [
      { code: 'OPERATIONS', nameTh: 'ฝ่ายปฏิบัติการ', nameEn: 'Operations Department', sortOrder: 1 },
      { code: 'COMMERCIAL', nameTh: 'ฝ่ายพาณิชย์', nameEn: 'Commercial Department', sortOrder: 2 },
      { code: 'FINANCE', nameTh: 'ฝ่ายการเงิน', nameEn: 'Finance Department', sortOrder: 3 },
      { code: 'LEGAL', nameTh: 'ฝ่ายกฎหมาย', nameEn: 'Legal Department', sortOrder: 4 },
      { code: 'HR', nameTh: 'ฝ่ายทรัพยากรบุคคล', nameEn: 'Human Resources', sortOrder: 5 },
      { code: 'IT', nameTh: 'ฝ่ายเทคโนโลยีสารสนเทศ', nameEn: 'Information Technology', sortOrder: 6 },
    ],
    skipDuplicates: true,
  });

  // === ผู้ใช้ระบบ ===
  const passwordHash = await bcrypt.hash('admin123', 10);
  const operatorHash = await bcrypt.hash('operator123', 10);

  await prisma.tmUser.createMany({
    data: [
      { userId: 'USR-001', username: 'admin', passwordHash, email: 'admin@doa.go.th', fullName: 'สถาพร ชัยมงคล', role: 'ADMIN' },
      { userId: 'USR-002', username: 'operator1', passwordHash: operatorHash, email: 'op1@doa.go.th', fullName: 'สุภาพร วงศ์ทอง', role: 'OPERATOR' },
      { userId: 'USR-003', username: 'supervisor1', passwordHash: operatorHash, email: 'sv1@doa.go.th', fullName: 'วิชัย สุขสวัสดิ์', role: 'SUPERVISOR' },
    ],
    skipDuplicates: true,
  });

  // === สิทธิ์การใช้งาน ===
  const modules = ['dashboard', 'floorplan', 'unit', 'contract', 'partner', 'billing', 'receipt', 'report', 'import', 'template', 'settings'];
  const permissions = modules.flatMap((module) => [
    { role: 'ADMIN', module, canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    { role: 'SUPERVISOR', module, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
    { role: 'OPERATOR', module, canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false },
  ]);
  await prisma.tmPermission.createMany({ data: permissions, skipDuplicates: true });

  // === ท่าอากาศยาน (22 แห่ง) ===
  const airports = [
    { airportCode: 'DMK', airportNameTh: 'ท่าอากาศยานดอนเมือง', airportNameEn: 'Don Mueang International Airport', province: 'กรุงเทพมหานคร', region: 'ภาคกลาง' },
    { airportCode: 'CNX', airportNameTh: 'ท่าอากาศยานเชียงใหม่', airportNameEn: 'Chiang Mai International Airport', province: 'เชียงใหม่', region: 'ภาคเหนือ' },
    { airportCode: 'HKT', airportNameTh: 'ท่าอากาศยานภูเก็ต', airportNameEn: 'Phuket International Airport', province: 'ภูเก็ต', region: 'ภาคใต้' },
    { airportCode: 'HDY', airportNameTh: 'ท่าอากาศยานหาดใหญ่', airportNameEn: 'Hat Yai International Airport', province: 'สงขลา', region: 'ภาคใต้' },
    { airportCode: 'CEI', airportNameTh: 'ท่าอากาศยานเชียงราย', airportNameEn: 'Chiang Rai Airport', province: 'เชียงราย', region: 'ภาคเหนือ' },
    { airportCode: 'UTP', airportNameTh: 'ท่าอากาศยานอู่ตะเภา', airportNameEn: 'U-Tapao International Airport', province: 'ระยอง', region: 'ภาคตะวันออก' },
    { airportCode: 'KKC', airportNameTh: 'ท่าอากาศยานขอนแก่น', airportNameEn: 'Khon Kaen Airport', province: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ' },
    { airportCode: 'UBP', airportNameTh: 'ท่าอากาศยานอุบลราชธานี', airportNameEn: 'Ubon Ratchathani Airport', province: 'อุบลราชธานี', region: 'ภาคตะวันออกเฉียงเหนือ' },
    { airportCode: 'NST', airportNameTh: 'ท่าอากาศยานนครศรีธรรมราช', airportNameEn: 'Nakhon Si Thammarat Airport', province: 'นครศรีธรรมราช', region: 'ภาคใต้' },
    { airportCode: 'KBV', airportNameTh: 'ท่าอากาศยานกระบี่', airportNameEn: 'Krabi Airport', province: 'กระบี่', region: 'ภาคใต้' },
    { airportCode: 'SNO', airportNameTh: 'ท่าอากาศยานสกลนคร', airportNameEn: 'Sakon Nakhon Airport', province: 'สกลนคร', region: 'ภาคตะวันออกเฉียงเหนือ' },
    { airportCode: 'THS', airportNameTh: 'ท่าอากาศยานสุโขทัย', airportNameEn: 'Sukhothai Airport', province: 'สุโขทัย', region: 'ภาคเหนือ' },
  ];
  await prisma.tmAirport.createMany({ data: airports, skipDuplicates: true });

  // ดึง airport ID สำหรับใช้สร้างข้อมูลย่อย
  const dmk = await prisma.tmAirport.findUnique({ where: { airportCode: 'DMK' } });
  if (!dmk) throw new Error('ไม่พบ DMK');

  // === อาคาร (ดอนเมือง) ===
  await prisma.tmBuilding.createMany({
    data: [
      { buildingCode: 'DMK-T1', buildingNameTh: 'อาคารผู้โดยสาร 1', buildingNameEn: 'Terminal 1', airportId: dmk.id, totalFloors: 4 },
      { buildingCode: 'DMK-T2', buildingNameTh: 'อาคารผู้โดยสาร 2', buildingNameEn: 'Terminal 2', airportId: dmk.id, totalFloors: 4 },
    ],
    skipDuplicates: true,
  });

  const t1 = await prisma.tmBuilding.findUnique({ where: { buildingCode: 'DMK-T1' } });
  if (!t1) throw new Error('ไม่พบ DMK-T1');

  // === ชั้น ===
  await prisma.tmFloor.createMany({
    data: [
      { floorCode: 'DMK-T1-F1', floorNameTh: 'ชั้น 1', floorNameEn: 'Floor 1', floorNumber: 1, buildingId: t1.id },
      { floorCode: 'DMK-T1-F2', floorNameTh: 'ชั้น 2', floorNameEn: 'Floor 2', floorNumber: 2, buildingId: t1.id },
      { floorCode: 'DMK-T1-F3', floorNameTh: 'ชั้น 3', floorNameEn: 'Floor 3', floorNumber: 3, buildingId: t1.id },
    ],
    skipDuplicates: true,
  });

  const f1 = await prisma.tmFloor.findUnique({ where: { floorCode: 'DMK-T1-F1' } });
  if (!f1) throw new Error('ไม่พบ DMK-T1-F1');

  // === โซน ===
  await prisma.tmZone.createMany({
    data: [
      { zoneCode: 'DMK-T1-F1-A', zoneNameTh: 'โซน A (ร้านอาหาร)', zoneNameEn: 'Zone A (F&B)', floorId: f1.id },
      { zoneCode: 'DMK-T1-F1-B', zoneNameTh: 'โซน B (ร้านค้า)', zoneNameEn: 'Zone B (Retail)', floorId: f1.id },
      { zoneCode: 'DMK-T1-F1-C', zoneNameTh: 'โซน C (บริการ)', zoneNameEn: 'Zone C (Service)', floorId: f1.id },
    ],
    skipDuplicates: true,
  });

  const zoneA = await prisma.tmZone.findUnique({ where: { zoneCode: 'DMK-T1-F1-A' } });
  const zoneB = await prisma.tmZone.findUnique({ where: { zoneCode: 'DMK-T1-F1-B' } });
  const zoneC = await prisma.tmZone.findUnique({ where: { zoneCode: 'DMK-T1-F1-C' } });
  if (!zoneA || !zoneB || !zoneC) throw new Error('ไม่พบ zone');

  // === ยูนิตพื้นที่เช่า (48 ยูนิต) ===
  const units = [
    // โซน A — ร้านอาหาร (16 ยูนิต)
    ...Array.from({ length: 16 }, (_, i) => ({
      unitCode: `A-${String(101 + i).padStart(3, '0')}`,
      unitNameTh: `คูหา A-${101 + i}`,
      airportId: dmk.id,
      zoneId: zoneA.id,
      areaSqm: 45 + Math.round(Math.random() * 60),
      status: i < 10 ? 'LEASED' as const : i < 13 ? 'RESERVED' as const : 'VACANT' as const,
      purpose: 'ร้านอาหาร',
      fpCoordX: 40 + (i % 4) * 160,
      fpCoordY: 80 + Math.floor(i / 4) * 100,
      fpWidth: 140,
      fpHeight: 80,
    })),
    // โซน B — ร้านค้า (16 ยูนิต)
    ...Array.from({ length: 16 }, (_, i) => ({
      unitCode: `B-${String(201 + i).padStart(3, '0')}`,
      unitNameTh: `คูหา B-${201 + i}`,
      airportId: dmk.id,
      zoneId: zoneB.id,
      areaSqm: 30 + Math.round(Math.random() * 40),
      status: i < 12 ? 'LEASED' as const : i < 14 ? 'RESERVED' as const : 'VACANT' as const,
      purpose: 'ร้านค้า',
      fpCoordX: 40 + (i % 4) * 160,
      fpCoordY: 520 + Math.floor(i / 4) * 100,
      fpWidth: 140,
      fpHeight: 80,
    })),
    // โซน C — บริการ (16 ยูนิต)
    ...Array.from({ length: 16 }, (_, i) => ({
      unitCode: `C-${String(301 + i).padStart(3, '0')}`,
      unitNameTh: `คูหา C-${301 + i}`,
      airportId: dmk.id,
      zoneId: zoneC.id,
      areaSqm: 20 + Math.round(Math.random() * 30),
      status: i < 12 ? 'LEASED' as const : 'VACANT' as const,
      purpose: 'บริการ',
      fpCoordX: 700 + (i % 2) * 160,
      fpCoordY: 80 + Math.floor(i / 2) * 100,
      fpWidth: 140,
      fpHeight: 80,
    })),
  ];
  await prisma.tmUnit.createMany({ data: units, skipDuplicates: true });

  // === ผู้เช่า / คู่ค้า ===
  const portalHash = await bcrypt.hash('tenant123', 10);
  const partners = [
    { partnerCode: 'P-001', partnerType: 'JURISTIC' as const, nameTh: 'บริษัท ฟู้ดแลนด์ จำกัด', taxId: '0105562001234', shopNameTh: 'ครัวไทย', contactPerson: 'นาย สมศักดิ์ รุ่งเรือง', phone: '081-234-5678', email: 'somsakr@foodland.co.th', portalPasswordHash: portalHash },
    { partnerCode: 'P-002', partnerType: 'INDIVIDUAL' as const, nameTh: 'นาย สมศักดิ์ วงศ์ทอง', taxId: '1100500123456', shopNameTh: 'The Brew Coffee', contactPerson: 'นาย สมศักดิ์ วงศ์ทอง', phone: '089-876-5432', email: 'somsak@thebrew.com', portalPasswordHash: portalHash },
    { partnerCode: 'P-003', partnerType: 'JURISTIC' as const, nameTh: 'บริษัท คิวเอ็ม จำกัด', taxId: '0105563009876', shopNameTh: 'QuickMart', contactPerson: 'นาง พิมพ์ใจ สุขสบาย', phone: '092-111-2222', email: 'pimjai@quickmart.co.th', portalPasswordHash: portalHash },
    { partnerCode: 'P-004', partnerType: 'JURISTIC' as const, nameTh: 'บริษัท อินนิก้า จำกัด', taxId: '0105564005555', shopNameTh: 'SouvThai', contactPerson: 'นาย ธนวัฒน์ เจริญสุข', phone: '086-333-4444', email: 'thanawat@innica.co.th', portalPasswordHash: portalHash },
    { partnerCode: 'P-005', partnerType: 'JURISTIC' as const, nameTh: 'บริษัท เฮลท์พลัส จำกัด', taxId: '0105567082345', shopNameTh: 'ร้านยา เฮลท์พลัส', contactPerson: 'นาย ประเสริฐ สุขดี', phone: '081-555-6666', email: 'prasert@healthplus.co.th', portalPasswordHash: portalHash },
    { partnerCode: 'P-006', partnerType: 'JURISTIC' as const, nameTh: 'บริษัท สยามบุ๊คส์ จำกัด', taxId: '0105565007777', shopNameTh: 'ร้านหนังสือ SiamBooks', contactPerson: 'นาง มาลี อ่อนน้อม', phone: '083-777-8888', email: 'malee@siambooks.co.th', portalPasswordHash: portalHash },
  ];
  await prisma.tmPartner.createMany({ data: partners, skipDuplicates: true });

  // === สัญญาเช่าตัวอย่าง ===
  const p1 = await prisma.tmPartner.findUnique({ where: { partnerCode: 'P-001' } });
  const p2 = await prisma.tmPartner.findUnique({ where: { partnerCode: 'P-002' } });
  const p3 = await prisma.tmPartner.findUnique({ where: { partnerCode: 'P-003' } });
  const p4 = await prisma.tmPartner.findUnique({ where: { partnerCode: 'P-004' } });
  const u1 = await prisma.tmUnit.findUnique({ where: { unitCode: 'A-101' } });
  const u2 = await prisma.tmUnit.findUnique({ where: { unitCode: 'B-201' } });
  const u3 = await prisma.tmUnit.findUnique({ where: { unitCode: 'C-305' } });
  const u4 = await prisma.tmUnit.findUnique({ where: { unitCode: 'A-112' } });

  if (p1 && p2 && p3 && p4 && u1 && u2 && u3 && u4) {
    // สัญญาค่าเช่าคงที่ — ร้านอาหารครัวไทย (ใกล้หมดอายุ 14 วัน)
    const c1 = await prisma.ttContract.create({
      data: {
        contractNo: 'CTR-2566-001',
        contractType: 'FIXED_RENT',
        contractStatus: 'ACTIVE',
        airportId: dmk.id,
        unitId: u1.id,
        partnerId: p1.id,
        startDate: new Date('2023-04-15'),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 วันจากวันนี้
        durationMonths: 36,
        paymentDueDay: 5,
        latePenaltyRate: 15,
        currentStepNo: 6,
        fixedRentDetail: {
          create: { monthlyRent: 65000 },
        },
      },
    });

    // สัญญาปันผลประโยชน์ — The Brew Coffee (ใกล้หมดอายุ 28 วัน)
    const c2 = await prisma.ttContract.create({
      data: {
        contractNo: 'CTR-2566-002',
        contractType: 'REVENUE_SHARING',
        contractStatus: 'ACTIVE',
        airportId: dmk.id,
        unitId: u2.id,
        partnerId: p2.id,
        startDate: new Date('2023-04-28'),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        durationMonths: 36,
        paymentDueDay: 5,
        latePenaltyRate: 15,
        currentStepNo: 6,
        revShareDetail: {
          create: {
            magAmount: 80000,
            revenueSharePct: 15,
            calcMethod: 'HIGHER_OF_MAG_OR_SHARE',
            useTieredRate: true,
            reportingFrequency: 'MONTHLY',
            reportDueDay: 7,
            verificationMethod: 'เชื่อมต่อ POS อัตโนมัติ',
            tieredRates: {
              createMany: {
                data: [
                  { tierOrder: 1, revenueFrom: 0, revenueTo: 500000, sharePct: 12 },
                  { tierOrder: 2, revenueFrom: 500001, revenueTo: 1000000, sharePct: 15 },
                  { tierOrder: 3, revenueFrom: 1000001, sharePct: 18 },
                ],
              },
            },
          },
        },
      },
    });

    // สัญญาค่าเช่าคงที่ — QuickMart (ใกล้หมดอายุ 45 วัน)
    await prisma.ttContract.create({
      data: {
        contractNo: 'CTR-2566-003',
        contractType: 'FIXED_RENT',
        contractStatus: 'ACTIVE',
        airportId: dmk.id,
        unitId: u3.id,
        partnerId: p3.id,
        startDate: new Date('2023-05-15'),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        durationMonths: 36,
        paymentDueDay: 10,
        latePenaltyRate: 15,
        currentStepNo: 6,
        fixedRentDetail: {
          create: { monthlyRent: 85000 },
        },
      },
    });

    // สัญญาค่าเช่าคงที่ — SouvThai (ใกล้หมดอายุ 67 วัน)
    await prisma.ttContract.create({
      data: {
        contractNo: 'CTR-2566-004',
        contractType: 'FIXED_RENT',
        contractStatus: 'ACTIVE',
        airportId: dmk.id,
        unitId: u4.id,
        partnerId: p4.id,
        startDate: new Date('2023-06-06'),
        endDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000),
        durationMonths: 36,
        paymentDueDay: 5,
        latePenaltyRate: 15,
        currentStepNo: 6,
        fixedRentDetail: {
          create: { monthlyRent: 45000 },
        },
      },
    });

    // === ใบแจ้งหนี้ตัวอย่าง ===
    const now = new Date();
    const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // บิลค้างชำระ
    await prisma.ttBill.create({
      data: {
        billNo: `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-001`,
        contractId: c1.id,
        billingMonth,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        status: 'OVERDUE',
        rentAmount: 65000,
        utilityAmount: 4500,
        commonServiceAmt: 3500,
        vatRate: 7,
        vatAmount: 5110,
        totalAmount: 78110,
        overdueDays: 7,
        lateFeeAmount: 224.15,
      },
    });

    // บิลรอชำระ
    await prisma.ttBill.create({
      data: {
        billNo: `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-002`,
        contractId: c2.id,
        billingMonth,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        status: 'ISSUED',
        rentAmount: 80000,
        utilityAmount: 3200,
        commonServiceAmt: 3500,
        vatRate: 7,
        vatAmount: 6069,
        totalAmount: 92769,
        reportedRevenue: 620000,
        revShareAmount: 93000,
      },
    });

    // บิลที่ชำระแล้ว (เดือนก่อน)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await prisma.ttBill.createMany({
      data: [
        {
          billNo: `BILL-${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}-001`,
          contractId: c1.id,
          billingMonth: lastMonth,
          dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
          status: 'PAID',
          rentAmount: 65000,
          utilityAmount: 4200,
          commonServiceAmt: 3500,
          vatRate: 7,
          vatAmount: 5089,
          totalAmount: 77789,
          paidAmount: 77789,
          paidAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 3),
        },
        {
          billNo: `BILL-${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}-002`,
          contractId: c2.id,
          billingMonth: lastMonth,
          dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
          status: 'PAID',
          rentAmount: 80000,
          utilityAmount: 3100,
          commonServiceAmt: 3500,
          vatRate: 7,
          vatAmount: 6062,
          totalAmount: 92662,
          paidAmount: 92662,
          paidAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 4),
          reportedRevenue: 580000,
          revShareAmount: 87000,
        },
      ],
    });
  }

  // === ตั้งค่าระบบ ===
  await prisma.tmConfig.createMany({
    data: [
      { configKey: 'TREASURY_PCT', configValue: '50', description: 'สัดส่วนรายได้ส่งกรมธนารักษ์ (%)' },
      { configKey: 'WELFARE_FUND_PCT', configValue: '20', description: 'สัดส่วนรายได้กองทุนสวัสดิการ ทย. (%)' },
      { configKey: 'REVOLVING_FUND_PCT', configValue: '30', description: 'สัดส่วนรายได้เงินทุนหมุนเวียน ทย. (%)' },
      { configKey: 'VAT_RATE', configValue: '7', description: 'อัตราภาษีมูลค่าเพิ่ม (%)' },
      { configKey: 'LATE_PENALTY_RATE', configValue: '15', description: 'อัตราค่าปรับชำระล่าช้า (%/ปี)' },
      { configKey: 'CONTRACT_ALERT_DAYS', configValue: '90', description: 'แจ้งเตือนสัญญาใกล้หมดอายุ (วัน)' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ เพิ่มข้อมูลตั้งต้นเสร็จสมบูรณ์');
  console.log('   - ผู้ใช้: 3 คน (admin/admin123, operator1/operator123)');
  console.log('   - ท่าอากาศยาน: 12 แห่ง');
  console.log('   - อาคาร/ชั้น/โซน: 2/3/3 (ดอนเมือง)');
  console.log('   - ยูนิตพื้นที่เช่า: 48 ยูนิต');
  console.log('   - ผู้เช่า: 6 ราย (portal password: tenant123)');
  console.log('   - สัญญา: 4 สัญญา');
  console.log('   - ใบแจ้งหนี้: 4 ใบ');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
