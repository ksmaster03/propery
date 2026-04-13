import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// === Helper สำหรับสร้าง PDF จาก HTML element ===
// ใช้สำหรับ Contract preview, Receipt, Bill

export async function generatePdfFromElement(
  elementId: string,
  filename: string,
  options?: { orientation?: 'portrait' | 'landscape' }
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element with id "${elementId}" not found`);

  // Render element เป็น canvas
  const canvas = await html2canvas(el, {
    scale: 2, // สูงขึ้นเพื่อความคมชัด
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  // สร้าง PDF (A4)
  const pdf = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // หลายหน้าถ้าเนื้อหายาว
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Footer page numbers
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(108, 127, 146);
    pdf.text(`หน้า ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  pdf.save(filename);
}

// === สร้าง PDF จาก data structure (ไม่ต้องมี HTML) ===
export function generateSimplePdf(
  title: string,
  rows: [string, string][],
  filename: string
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(16);
  pdf.text(title, pageWidth / 2, 20, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text('กรมท่าอากาศยาน · Department of Airports', pageWidth / 2, 28, { align: 'center' });

  let y = 45;
  pdf.setFontSize(11);
  rows.forEach(([label, value]) => {
    pdf.setTextColor(108, 127, 146);
    pdf.text(label, 20, y);
    pdf.setTextColor(23, 50, 74);
    pdf.text(value, 90, y);
    y += 8;
  });

  pdf.save(filename);
}
