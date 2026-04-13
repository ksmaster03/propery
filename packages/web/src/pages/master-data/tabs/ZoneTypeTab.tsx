import SimpleCrudTable from '../SimpleCrudTable';

export default function ZoneTypeTab() {
  return (
    <SimpleCrudTable
      entity="zone-types"
      titleTh="ประเภทโซน"
      titleEn="Zone Types"
      descriptionTh="ใช้เป็น dropdown ตอนกำหนดพื้นที่บน Floor Plan และสร้างสัญญา"
      descriptionEn="Used in Floor Plan area definition and contract creation dropdowns"
      fields={[
        { key: 'code', labelTh: 'รหัส', labelEn: 'Code', required: true },
        { key: 'nameTh', labelTh: 'ชื่อ (ไทย)', labelEn: 'Name (Thai)', required: true },
        { key: 'nameEn', labelTh: 'ชื่อ (อังกฤษ)', labelEn: 'Name (English)' },
        { key: 'icon', labelTh: 'ไอคอน', labelEn: 'Icon', type: 'icon' },
        { key: 'color', labelTh: 'สี', labelEn: 'Color', type: 'color' },
        { key: 'defaultRate', labelTh: 'อัตราเริ่มต้น (บาท/ตร.ม.)', labelEn: 'Default Rate (THB/sqm)', type: 'number' },
        { key: 'sortOrder', labelTh: 'ลำดับ', labelEn: 'Order', type: 'number' },
      ]}
    />
  );
}
