import SimpleCrudTable from '../SimpleCrudTable';

export default function DocumentTypeTab() {
  return (
    <SimpleCrudTable
      entity="document-types"
      titleTh="ประเภทเอกสาร"
      titleEn="Document Types"
      descriptionTh="รายการเอกสารที่ต้องแนบตอนสร้างสัญญา"
      descriptionEn="Required documents during contract creation"
      fields={[
        { key: 'code', labelTh: 'รหัส', labelEn: 'Code', required: true },
        { key: 'nameTh', labelTh: 'ชื่อเอกสาร (ไทย)', labelEn: 'Name (Thai)', required: true },
        { key: 'nameEn', labelTh: 'ชื่อเอกสาร (อังกฤษ)', labelEn: 'Name (English)' },
        { key: 'sortOrder', labelTh: 'ลำดับ', labelEn: 'Order', type: 'number' },
      ]}
    />
  );
}
