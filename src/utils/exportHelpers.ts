import { jsPDF } from 'jspdf';

/**
 * Interface for PDF and Excel export options
 */
interface ExportData {
  title: string;
  className: string;
  teacherName: string;
  headers: string[];
  rows: any[][];
  colWidths?: number[]; // custom widths summing to 180 (A4 content width in mm)
  filename: string;
}

/**
 * Clean up text helper to avoid printing 'undefined' or 'null'
 */
const cleanVal = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

/**
 * Format currency to IDR format
 */
export const formatIDR = (val: any): string => {
  const num = Number(val);
  if (isNaN(num)) return cleanVal(val);
  return 'Rp ' + num.toLocaleString('id-ID');
};

/**
 * Generates and downloads a beautifully styled Excel (.xls) spreadsheet 
 * which opens perfectly in MS Excel with actual gridlines, fonts, borders, and colors.
 */
export const exportToExcel = ({
  title,
  className,
  teacherName,
  headers,
  rows,
  filename
}: ExportData) => {
  const sheetName = title.slice(0, 30).replace(/[:\\/?*[\]]/g, ''); // Excel sheet name constraints
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .kop-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .kop-cell { text-align: center; font-weight: bold; }
        .kop-title-1 { font-size: 14pt; color: #1E293B; text-transform: uppercase; }
        .kop-title-2 { font-size: 16pt; color: #111827; text-transform: uppercase; letter-spacing: 1px; }
        .kop-subtitle { font-size: 9pt; font-weight: normal; color: #4B5563; font-style: italic; }
        .divider { border-top: 3px double #1E293B; margin-top: 5px; margin-bottom: 20px; }
        
        .doc-title { font-size: 13pt; font-weight: bold; color: #1F2937; text-transform: uppercase; margin-bottom: 15px; }
        
        .metadata-table { border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
        .metadata-table td { border: none; padding: 4px 8px; color: #374151; }
        .metadata-label { font-weight: bold; width: 120px; }
        
        .data-table { border-collapse: collapse; width: 100%; font-size: 10pt; }
        .data-table th { background-color: #1E293B; color: #FFFFFF; font-weight: bold; border: 1px solid #475569; padding: 10px 8px; text-align: left; }
        .data-table td { border: 1px solid #CBD5E1; padding: 8px; color: #334155; }
        .data-table tr:nth-child(even) { background-color: #F8FAFC; }
        
        .signature-section { margin-top: 40px; width: 100%; font-size: 10pt; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { border: none; padding: 10px; text-align: center; color: #1F2937; }
      </style>
    </head>
    <body>
      <table class="kop-table">
        <tr>
          <td class="kop-cell">
            <span class="kop-title-1">Pemerintah Kabupaten Sukabumi</span><br>
            <span class="kop-title-1">Dinas Pendidikan</span><br>
            <span class="kop-title-2">SD Negeri Cimandirasa</span><br>
            <span class="kop-subtitle">Alamat: Dusun Cimandirasa, RT 02 / RW 05, Desa Cimandirasa, Kec. Cikakak, Sukabumi, Jawa Barat</span>
          </td>
        </tr>
      </table>
      <div class="divider"></div>

      <div class="doc-title">${title}</div>

      <table class="metadata-table">
        <tr>
          <td class="metadata-label">Kelas</td>
          <td>: ${className}</td>
        </tr>
        <tr>
          <td class="metadata-label">Wali Kelas</td>
          <td>: ${teacherName}</td>
        </tr>
        <tr>
          <td class="metadata-label">Tanggal Unduh</td>
          <td>: ${dateStr}</td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">No</th>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${index + 1}</td>
              ${row.map(val => {
                const clean = cleanVal(val);
                // Check if value is numeric, if so right-align
                const isNumeric = !isNaN(Number(clean)) && clean !== '' && !clean.startsWith('0');
                const alignStyle = isNumeric ? 'text-align: right;' : '';
                return `<td style="${alignStyle}">${clean}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="signature-section">
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              Mengetahui,<br>
              Kepala Sekolah SDN Cimandirasa<br><br><br><br><br>
              <b><u>H. SUPRIATNA, S.Pd.</u></b><br>
              NIP. 196805121991031005
            </td>
            <td style="width: 50%;">
              Sukabumi, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
              Wali Kelas ${className}<br><br><br><br><br>
              <b><u>${teacherName}</u></b><br>
              NIP. -
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  // Encode as excel blob and download
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : filename.replace(/\.[^/.]+$/, "") + ".xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates and downloads a beautifully styled, high-quality, official PDF document.
 * Leverages jsPDF vector operations to handle cell alignments, multiple pages,
 * custom fonts, borders, alternating rows, and proper auto-wrapping of multi-line text!
 */
export const exportToPDF = ({
  title,
  className,
  teacherName,
  headers,
  rows,
  colWidths,
  filename
}: ExportData) => {
  // Initialize jsPDF A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width; // 210
  const pageHeight = doc.internal.pageSize.height; // 297
  const marginX = 15;
  const printWidth = pageWidth - (marginX * 2); // 180

  // Calculate default column widths if none provided
  let widths = colWidths;
  if (!widths || widths.length !== headers.length) {
    const colCount = headers.length;
    // reserve 10mm for Number column, split remaining 170mm evenly
    const evenWidth = 170 / colCount;
    widths = [10, ...Array(colCount).fill(evenWidth)];
  } else {
    // Add 10mm for number column and adjust remaining widths proportionally to fit exactly 170mm
    const sumWidths = widths.reduce((a, b) => a + b, 0);
    const scale = 170 / sumWidths;
    widths = [10, ...widths.map(w => w * scale)];
  }

  // Final adjusted headers (includes "No")
  const finalHeaders = ["No", ...headers];

  let currentY = 15;

  const drawHeaderAndKop = () => {
    doc.setTextColor(30, 41, 59); // Slate-800
    
    // Kop Surat
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("PEMERINTAH KABUPATEN SUKABUMI", pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
    
    doc.text("DINAS PENDIDIKAN", pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text("SD NEGERI CIMANDIRASA", pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.text("Alamat: Dusun Cimandirasa, RT 02 / RW 05, Desa Cimandirasa, Kec. Cikakak, Sukabumi", pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    // Double line divider
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 0.8, pageWidth - marginX, currentY + 0.8);
    currentY += 6;

    // Document Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Metadata
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81); // Gray-700
    
    doc.text(`Kelas: ${className}`, marginX, currentY);
    doc.text(`Wali Kelas: ${teacherName}`, marginX + 65, currentY);
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Tanggal Unduh: ${dateFormatted}`, pageWidth - marginX, currentY, { align: 'right' });
    
    currentY += 6;
  };

  // Render Kop & Header on First Page
  drawHeaderAndKop();

  // Draw Table Headers
  const drawTableHeaders = (startY: number) => {
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(marginX, startY, printWidth, 8.5, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255); // White
    doc.setDrawColor(71, 85, 105); // Slate-600
    doc.setLineWidth(0.25);

    let xOffset = marginX;
    finalHeaders.forEach((header, index) => {
      const w = widths![index];
      // Draw border
      doc.rect(xOffset, startY, w, 8.5, 'S');
      
      // Text centering in cell
      const textX = xOffset + (w / 2);
      const textY = startY + 5.5;
      doc.text(header, textX, textY, { align: 'center' });
      xOffset += w;
    });

    return startY + 8.5;
  };

  currentY = drawTableHeaders(currentY);

  // Render Table Rows
  rows.forEach((row, rowIndex) => {
    // Add "No" at index 0
    const finalRow = [String(rowIndex + 1), ...row.map(cleanVal)];

    // We must handle row-wrapping and multi-line heights.
    // Calculate the max lines in any cell to determine row height.
    const cellLines: string[][] = [];
    let maxLines = 1;

    finalRow.forEach((val, colIndex) => {
      const w = widths![colIndex] - 4; // 2mm padding on left/right
      const lines = doc.splitTextToSize(val, w);
      cellLines.push(lines);
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    });

    // Row height is based on max lines (each line takes about 4.2mm, plus some padding)
    const padding = 3.5;
    const rowHeight = (maxLines * 4) + padding;

    // Check page overflow
    if (currentY + rowHeight > pageHeight - 25) { // 25mm buffer for footer
      // Add page
      doc.addPage();
      currentY = 15;
      // Re-draw table headers on new page
      currentY = drawTableHeaders(currentY);
    }

    // Alternating background fill
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252); // Slate-50 / Light gray
      doc.rect(marginX, currentY, printWidth, rowHeight, 'F');
    }

    // Draw cells
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setDrawColor(203, 213, 225); // Slate-300

    let xOffset = marginX;
    finalRow.forEach((_, colIndex) => {
      const w = widths![colIndex];
      const lines = cellLines[colIndex];

      // Draw cell border
      doc.rect(xOffset, currentY, w, rowHeight, 'S');

      // Draw lines
      lines.forEach((lineText, lineIndex) => {
        // Vertical centering offset
        const totalTextHeight = lines.length * 4;
        const startTextY = currentY + ((rowHeight - totalTextHeight) / 2) + 3;
        const lineY = startTextY + (lineIndex * 4);

        if (colIndex === 0) {
          // Center-align the index number
          doc.setFont('Helvetica', 'bold');
          doc.text(lineText, xOffset + (w / 2), lineY, { align: 'center' });
          doc.setFont('Helvetica', 'normal');
        } else {
          // Check if numeric, right-align. Else left-align
          const isNumeric = !isNaN(Number(lineText)) && lineText !== '' && !lineText.startsWith('0') && !lineText.includes('-') && !lineText.includes('/') && !lineText.includes(':');
          if (isNumeric) {
            doc.text(lineText, xOffset + w - 2.5, lineY, { align: 'right' });
          } else {
            doc.text(lineText, xOffset + 2.5, lineY);
          }
        }
      });

      xOffset += w;
    });

    currentY += rowHeight;
  });

  // Check signature section overflow
  const sigHeight = 40;
  if (currentY + sigHeight > pageHeight - 15) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 10;
  }

  // Draw Signatures
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Left Signee: Kepala Sekolah
  let sigY = currentY;
  doc.text("Mengetahui,", marginX + 5, sigY);
  sigY += 4.5;
  doc.text("Kepala Sekolah SDN Cimandirasa", marginX + 5, sigY);
  sigY += 18;
  doc.setFont('Helvetica', 'bold-underlined');
  // Dynamic draw line & bold manually
  doc.setFont('Helvetica', 'bold');
  doc.text("H. SUPRIATNA, S.Pd.", marginX + 5, sigY);
  // Add line underneath name
  const nameWidth = doc.getTextWidth("H. SUPRIATNA, S.Pd.");
  doc.setLineWidth(0.2);
  doc.line(marginX + 5, sigY + 0.5, marginX + 5 + nameWidth, sigY + 0.5);
  doc.setFont('Helvetica', 'normal');
  sigY += 4.5;
  doc.text("NIP. 196805121991031005", marginX + 5, sigY);

  // Right Signee: Wali Kelas
  sigY = currentY;
  const rightAlignX = pageWidth - marginX - 5;
  const dateStr = `Sukabumi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.text(dateStr, rightAlignX, sigY, { align: 'right' });
  sigY += 4.5;
  doc.text(`Wali Kelas ${className}`, rightAlignX, sigY, { align: 'right' });
  sigY += 18;
  doc.setFont('Helvetica', 'bold');
  doc.text(teacherName, rightAlignX, sigY, { align: 'right' });
  const teacherNameWidth = doc.getTextWidth(teacherName);
  doc.line(rightAlignX - teacherNameWidth, sigY + 0.5, rightAlignX, sigY + 0.5);
  doc.setFont('Helvetica', 'normal');
  sigY += 4.5;
  doc.text("NIP. -", rightAlignX, sigY, { align: 'right' });

  // Add Page Numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Gray-400
    doc.text(`Halaman ${i} dari ${totalPages}  |  SDN Cimandirasa Smart Portal`, marginX, pageHeight - 8);
  }

  // Save the PDF
  const finalFilename = filename.endsWith('.pdf') ? filename : filename.replace(/\.[^/.]+$/, "") + ".pdf";
  doc.save(finalFilename);
};
