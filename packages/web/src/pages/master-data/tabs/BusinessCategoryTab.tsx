import SimpleCrudTable from '../SimpleCrudTable';

export default function BusinessCategoryTab() {
  return (
    <SimpleCrudTable
      entity="business-categories"
      titleTh="หมวดหมู่ธุรกิจ"
      titleEn="Business Categories"
      descriptionTh="ใช้กำหนดวัตถุประสงค์การเช่าใน Contract Wizard และ Unit Master"
      descriptionEn="Used to define rental purpose in Contract Wizard and Unit Master"
      fields={[
        { key: 'code', labelTh: 'รหัส', labelEn: 'Code', required: true },
        { key: 'nameTh', labelTh: 'ชื่อ (ไทย)', labelEn: 'Name (Thai)', required: true },
        { key: 'nameEn', labelTh: 'ชื่อ (อังกฤษ)', labelEn: 'Name (English)' },
        { key: 'icon', labelTh: 'ไอคอน', labelEn: 'Icon', type: 'icon' },
        { key: 'sortOrder', labelTh: 'ลำดับ', labelEn: 'Order', type: 'number' },
      ]}
    />
  );
}
