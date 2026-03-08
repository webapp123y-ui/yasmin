import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateStudentsQR_PDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // 1. Remove all external stylesheets to prevent html2canvas from parsing them
        const links = Array.from(clonedDoc.getElementsByTagName('link'));
        links.forEach(link => {
          if (link.rel === 'stylesheet') {
            link.parentNode?.removeChild(link);
          }
        });

        // 2. Remove all style tags that might contain oklch
        const styles = Array.from(clonedDoc.getElementsByTagName('style'));
        styles.forEach(style => {
          style.parentNode?.removeChild(style);
        });

        // 3. Add a basic style for the grid and layout that we need
        const newStyle = clonedDoc.createElement('style');
        newStyle.innerHTML = `
          #qr-print-template {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 30px !important;
            background-color: white !important;
            padding: 30px !important;
            width: 210mm !important;
            min-height: 297mm !important;
            direction: rtl !important;
          }
          * {
            box-sizing: border-box !important;
            color-scheme: light !important;
          }
        `;
        clonedDoc.head.appendChild(newStyle);

        // 4. Sanitize all elements and remove all classes to avoid oklch inheritance
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.removeAttribute) {
            el.removeAttribute('class');
          }
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
