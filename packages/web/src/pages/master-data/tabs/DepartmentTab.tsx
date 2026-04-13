import SimpleCrudTable from '../SimpleCrudTable';

export default function DepartmentTab() {
  return (
    <SimpleCrudTable
      entity="departments"
      titleTh="แผนก / ฝ่าย"
      titleEn="Departments"
      descriptionTh="แผนก/ฝ่ายในหน่วยงาน สำหรับกำหนดเจ้าหน้าที่รับผิดชอบ"
      descriptionEn="Departments in organization for user assignment"
      fields={[
        { key: 'code', labelTh: 'รหัส', labelEn: 'Code', required: true },
        { key: 'nameTh', labelTh: 'ชื่อแผนก (ไทย)', labelEn: 'Name (Thai)', required: true },
        { key: 'nameEn', labelTh: 'ชื่อแผนก (อังกฤษ)', labelEn: 'Name (English)' },
        { key: 'sortOrder', labelTh: 'ลำดับ', labelEn: 'Order', type: 'number' },
      ]}
    />
  );
}
