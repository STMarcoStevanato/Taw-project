import PDFDocument from 'pdfkit';
import { TranscriptRecordsPayload } from '../types/exams';

export const generateRecordsFile = (payload: TranscriptRecordsPayload): PDFKit.PDFDocument => {
  const { user, referent, mapping, application, university } = payload;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  // --- HEADER ---
  doc
    .fillColor('#1A365D')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('Transcript of Records', { align: 'center' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#4A5568')
    .text(
      `Document Version ID: ${mapping.version_id} | Application ID: ${application.application_id}`,
      { align: 'center' }
    )
    .moveDown(1.5);

  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  const startY = doc.y;
  doc.fillColor('#2B6CB0').font('Helvetica-Bold').fontSize(12).text('Student & Mobility Details', 40, startY);
  doc.moveDown(0.5);

  const detailStartY = doc.y;

  const hostUniversityStr = university 
    ? `${university.name} (${university.city}, ${university.Countries?.name || ''})`
    : `Institution #${application.host_institution_id}`;

  const referentFullName = `${referent.name} ${referent.lastname}`;

  doc
    .fillColor('#2D3748')
    .font('Helvetica')
    .fontSize(10)
    .text(`Student: ${user.name} ${user.lastname}`, 40, detailStartY)
    .text(`Email: ${user.email}`)
    .text(`Academic Year: ${application.academic_year}`)
    .text(`Mobility Period: ${application.expected_mobility_period.replace('_', ' ')}`);

  doc
    .text(`Host Institution: ${hostUniversityStr}`, 300, detailStartY, { width: 255 })
    .moveDown(0.2)
    .text(`Referent: ${referentFullName}`)
    .text(`Arrival Date: ${formatDate(application.arrival_date)}`)
    .text(`Departure Date: ${formatDate(application.departure_date)}`);

  doc.moveDown(2);

  const tableTop = doc.y + 10;
  doc.fillColor('#2B6CB0').font('Helvetica-Bold').fontSize(12).text('Recognized Courses & Exams', 40, tableTop);
  
  const headerY = tableTop + 20;


  doc.rect(40, headerY, 515, 20).fill('#EDF2F7');


  doc
    .fillColor('#2D3748')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Foreign Course ID', 50, headerY + 6, { width: 140 })
    .text("Ca' Foscari Course ID", 195, headerY + 6, { width: 140 })
    .text('Exam Date', 340, headerY + 6, { width: 100 })
    .text('Score', 445, headerY + 6, { width: 100 });

  let currentY = headerY + 20;

  mapping.mappings.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(40, currentY, 515, 22).fill('#F7FAFC');
    }

    const examDate = item.recognized_exam ? formatDate(item.recognized_exam.exam_date) : '-';
    const score = item.recognized_exam ? String(item.recognized_exam.foreign_score) : '-';

    doc
      .fillColor('#2D3748')
      .font('Helvetica')
      .fontSize(9)
      .text(`${item.foreign_course_id}`, 50, currentY + 6, { width: 140 })
      .text(`${item.cafoscari_course_id}`, 195, currentY + 6, { width: 140 })
      .text(examDate, 340, currentY + 6, { width: 100 })
      .text(score, 445, currentY + 6, { width: 100 });

    currentY += 22;
  });

  doc
    .rect(40, headerY, 515, currentY - headerY)
    .strokeColor('#CBD5E0')
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#A0AEC0')
    .text(
      `Generated automatically on ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}`,
      40,
      760,
      { align: 'center', width: 515 }
    );

  doc.end();
  return doc;
};