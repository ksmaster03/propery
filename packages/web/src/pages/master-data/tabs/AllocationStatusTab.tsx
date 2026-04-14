import SimpleCrudTable from '../SimpleCrudTable';

// Master data: สถานะการจัดสรรพื้นที่ — ใช้ใน Floor Plan booking
// mapsTo map เป็น UnitStatus enum (VACANT/LEASED/RESERVED/MAINTENANCE)
export default function AllocationStatusTab() {
  return (
    <SimpleCrudTable
      entity="allocation-statuses"
      titleTh="สถานะการจัดสรรพื้นที่"
      titleEn="Allocation Statuses"
      descriptionTh="ใช้เป็น dropdown ตอนวาดพื้นที่บน Floor Plan — map ไปยังสถานะของ unit"
      descriptionEn="Dropdown options when drawing zones on Floor Plan — maps to unit status"
      fields={[
        { key: 'code', labelTh: 'รหัส', labelEn: 'Code', required: true },
        { key: 'nameTh', labelTh: 'ชื่อ (ไทย)', labelEn: 'Name (Thai)', required: true },
        { key: 'nameEn', labelTh: 'ชื่อ (อังกฤษ)', labelEn: 'Name (English)' },
        {
          key: 'mapsTo',
          labelTh: 'Map → สถานะ Unit',
          labelEn: 'Maps to Unit Status',
          required: true,
          type: 'select',
          options: [
            { value: 'VACANT',      labelTh: 'ว่าง (VACANT)' },
            { value: 'LEASED',      labelTh: 'เช่าแล้ว (LEASED)' },
            { value: 'RESERVED',    labelTh: 'จอง / สงวน (RESERVED)' },
            { value: 'MAINTENANCE', labelTh: 'ซ่อมแซม (MAINTENANCE)' },
          ],
        },
        { key: 'icon', labelTh: 'ไอคอน', labelEn: 'Icon', type: 'icon' },
        { key: 'color', labelTh: 'สี', labelEn: 'Color', type: 'color' },
        { key: 'description', labelTh: 'คำอธิบาย', labelEn: 'Description' },
        { key: 'sortOrder', labelTh: 'ลำดับ', labelEn: 'Order', type: 'number' },
      ]}
    />
  );
}
