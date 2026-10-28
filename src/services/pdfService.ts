import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
  signatureDataUrl?: string;
}

/**
 * Generates and downloads a high-fidelity PDF from an HTML element
 * using html2canvas for pixel-perfect rendering and jsPDF for document generation.
 */
export async function generateDocumentPdf(options: GeneratePdfOptions = {}): Promise<boolean> {
  const elementId = options.elementId || 'printable-document';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`[pdfService] Element with id "${elementId}" not found for PDF export.`);
    // Fallback to print dialog if element not found
    window.print();
    return false;
  }

  try {
    // Add temporary styling class for clean PDF rendering if needed
    const prevShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    // Capture using html2canvas with 2x resolution for crisp text & tables
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
    });

    // Restore original styles
    element.style.boxShadow = prevShadow;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Multi-page handling if document is very long
    while (heightLeft > 5) {
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const safeFilename = (options.filename || `Document_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .replace(/\.pdf$/i, '') + '.pdf';

    pdf.save(safeFilename);
    return true;
  } catch (err) {
    console.error('[pdfService] Error generating PDF:', err);
    // Graceful fallback to browser print if canvas generation fails
    window.print();
    return false;
  }
}
