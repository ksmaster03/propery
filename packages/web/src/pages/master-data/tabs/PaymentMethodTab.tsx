import SimpleCrudTable from '../SimpleCrudTable';

export default function PaymentMethodTab() {
  return (
    <SimpleCrudTable
      entity="payment-methods"
      titleTh="วิธีการชำระเงิน"
      titleEn="Payment Methods"
      descriptionTh="ใช้เป็น dropdown ตอนบันทึกการชำระเงิน"
      descriptionEn="Used in payment recording dropdown"
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
