import PDFDocument from 'pdfkit';
import { TranscriptRecordsPayload } from '../types/exams';
import { LearningAgreementPayload } from "../types/exams";

export const generateLearningAgreement = (
  payload: LearningAgreementPayload
): PDFKit.PDFDocument => {

  const {
      application,
      version,
      student,
      referent,
      host_institution,
      mappings,
      total_credits
  } = payload;

  const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
  });

  const margin = 40;
  const pageWidth = doc.page.width - margin * 2;
  const columnWidth = pageWidth / 2;
  const padding = 12;

  const colors = {
      primary: '#1A365D',
      secondary: '#2B6CB0',
      text: '#2D3748',
      muted: '#4A5568',
      border: '#CBD5E0',
      header: '#EDF2F7',
      alternate: '#F7FAFC',
      white: '#FFFFFF'
  };


  // --- FORMATTERS ---

  const formatDate = (
      date: string | Date | null | undefined
  ): string => {

      if (!date) return '-';

      return new Date(date).toLocaleDateString('it-IT', {
          timeZone: 'Europe/Rome'
      });
  };

  const formatPeriod = (period: string): string => {

      switch (period) {
          case 'first_semester':
              return 'First semester';

          case 'second_semester':
              return 'Second semester';

          case 'full_year':
              return 'Full academic year';

          default:
              return period;
      }
  };


  // --- PAGE MANAGEMENT ---

  const ensureSpace = (requiredHeight: number): void => {

      const bottom =
          doc.page.height - doc.page.margins.bottom;

      if (doc.y + requiredHeight > bottom) {
          doc.addPage();
      }
  };


  // --- DOCUMENT HEADER ---

  doc
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Learning Agreement', {
          align: 'center'
      })
      .font('Helvetica')
      .fontSize(11)
      .fillColor(colors.muted)
      .text('Student Mobility for Studies', {
          align: 'center'
      })
      .moveDown(0.5)
      .fontSize(9)
      .text(
          `Application ID: ${application.application_id} | ` +
          `Version: ${version.version_number} | ` +
          `Version ID: ${version.version_id}`,
          {
              align: 'center'
          }
      )
      .moveDown(1.5);

  doc
      .strokeColor(colors.border)
      .lineWidth(1)
      .moveTo(margin, doc.y)
      .lineTo(margin + pageWidth, doc.y)
      .stroke();

  doc.moveDown(1);


  // --- STUDENT & MOBILITY DETAILS ---

  doc
      .fillColor(colors.secondary)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('1. Student & Mobility Details')
      .moveDown(0.7);

  const hostUniversityName =
      host_institution?.name || 'Receiving Institution';

  const hostUniversityStr = host_institution
      ? `${host_institution.name} (${host_institution.city}, ${
          host_institution.Countries?.name || ''
      })`
      : '-';

  const detailStartY = doc.y;
  const detailColumnGap = 20;
  const detailColumnWidth =
      (pageWidth - detailColumnGap) / 2;


  // Left column

  doc
      .fillColor(colors.text)
      .font('Helvetica')
      .fontSize(10)
      .text(
          `Student: ${student.name} ${student.lastname}`,
          margin,
          detailStartY,
          { width: detailColumnWidth }
      )
      .text(`Email: ${student.email}`, {
          width: detailColumnWidth
      })
      .text(`Academic Year: ${application.academic_year}`, {
          width: detailColumnWidth
      })
      .text(
          `Mobility Period: ${
              formatPeriod(application.expected_mobility_period)
          }`,
          { width: detailColumnWidth }
      )
      .text(
          `Arrival Date: ${formatDate(application.arrival_date)}`,
          { width: detailColumnWidth }
      )
      .text(
          `Departure Date: ${formatDate(application.departure_date)}`,
          { width: detailColumnWidth }
      );

  const leftColumnEnd = doc.y;


  // Right column

  doc
      .text(
          "Sending Institution: Università Ca' Foscari Venezia",
          margin + detailColumnWidth + detailColumnGap,
          detailStartY,
          { width: detailColumnWidth }
      )
      .text(
          `Receiving Institution: ${hostUniversityStr}`,
          { width: detailColumnWidth }
      )
      .text(
          `Referent: ${referent.name} ${referent.lastname}`,
          { width: detailColumnWidth }
      )
      .text(
          `Referent Email: ${referent.email}`,
          { width: detailColumnWidth }
      );

  const rightColumnEnd = doc.y;

  doc.x = margin;
  doc.y = Math.max(leftColumnEnd, rightColumnEnd);

  doc.moveDown(2);


  // --- COURSE MAPPING TABLE ---

  type Course =
      LearningAgreementPayload['mappings'][number]['cafoscari_courses'][number];

  const contentWidth = columnWidth - padding * 2;


  // Calculate the table header height

  const calculateHeaderHeight = (): number => {

      doc.font('Helvetica-Bold').fontSize(11);

      const titleHeight = Math.max(
          doc.heightOfString("Ca' Foscari University", {
              width: contentWidth
          }),
          doc.heightOfString(hostUniversityName, {
              width: contentWidth
          })
      );

      doc.font('Helvetica').fontSize(9);

      const subtitleHeight = doc.heightOfString(
          'Receiving institution',
          { width: contentWidth }
      );

      return titleHeight + subtitleHeight + padding * 2 + 4;
  };

  const headerHeight = calculateHeaderHeight();


  // Draw table header

  const drawTableHeader = (): void => {

      const headerY = doc.y;

      doc
          .rect(margin, headerY, pageWidth, headerHeight)
          .fill(colors.header);

      const drawHeaderCell = (
          title: string,
          subtitle: string,
          x: number
      ): void => {

          doc
              .fillColor(colors.primary)
              .font('Helvetica-Bold')
              .fontSize(11)
              .text(
                  title,
                  x + padding,
                  headerY + padding,
                  { width: contentWidth }
              );

          doc
              .fillColor(colors.muted)
              .font('Helvetica')
              .fontSize(9)
              .text(
                  subtitle,
                  x + padding,
                  doc.y + 4,
                  { width: contentWidth }
              );
      };

      drawHeaderCell(
          "Ca' Foscari University",
          'Sending institution',
          margin
      );

      drawHeaderCell(
          hostUniversityName,
          'Receiving institution',
          margin + columnWidth
      );

      doc
          .strokeColor(colors.border)
          .lineWidth(0.5)
          .rect(margin, headerY, pageWidth, headerHeight)
          .stroke();

      doc
          .moveTo(margin + columnWidth, headerY)
          .lineTo(
              margin + columnWidth,
              headerY + headerHeight
          )
          .stroke();

      doc.x = margin;
      doc.y = headerY + headerHeight;
  };


  // Calculate the height required by a course cell

  const calculateCellHeight = (
      courses: Course[],
      creditLabel: string
  ): number => {

      let height = 0;

      if (courses.length === 0) {

          doc.font('Helvetica').fontSize(10);

          return doc.heightOfString('-', {
              width: contentWidth
          });
      }

      courses.forEach((course, index) => {

          doc.font('Helvetica').fontSize(9);

          height += doc.heightOfString(
              String(course.course_code ?? '-'),
              { width: contentWidth }
          );

          height += 4;

          doc.font('Helvetica-Bold').fontSize(10);

          height += doc.heightOfString(
              String(course.course_name ?? '-'),
              { width: contentWidth }
          );

          height += 4;

          doc.font('Helvetica').fontSize(9);

          height += doc.heightOfString(
              `${course.credits} ${creditLabel}`,
              { width: contentWidth }
          );

          if (index < courses.length - 1) {
              height += 12;
          }
      });

      return height;
  };


  // Draw courses inside a table cell

  const drawCourseCell = (
      courses: Course[],
      x: number,
      y: number,
      creditLabel: string
  ): void => {

      let currentY = y + padding;

      if (courses.length === 0) {

          doc
              .fillColor(colors.muted)
              .font('Helvetica')
              .fontSize(10)
              .text('-', x + padding, currentY, {
                  width: contentWidth
              });

          return;
      }

      courses.forEach((course, index) => {

          // Course code

          doc
              .fillColor(colors.muted)
              .font('Helvetica')
              .fontSize(9)
              .text(
                  String(course.course_code ?? '-'),
                  x + padding,
                  currentY,
                  { width: contentWidth }
              );


          // Course name

          doc
              .fillColor(colors.text)
              .font('Helvetica-Bold')
              .fontSize(10)
              .text(
                  String(course.course_name ?? '-'),
                  x + padding,
                  doc.y + 4,
                  { width: contentWidth }
              );


          // Course credits

          doc
              .fillColor(colors.muted)
              .font('Helvetica')
              .fontSize(9)
              .text(
                  `${course.credits} ${creditLabel}`,
                  x + padding,
                  doc.y + 4,
                  { width: contentWidth }
              );

          currentY = doc.y;

          if (index < courses.length - 1) {
              currentY += 12;
          }
      });
  };


  // --- TABLE SECTION TITLE ---

  const firstRowHeight = mappings.length > 0
      ? Math.max(
          60,
          calculateCellHeight(
              mappings[0].cafoscari_courses,
              'CFU'
          ) + padding * 2,
          calculateCellHeight(
              mappings[0].foreign_courses,
              'ECTS'
          ) + padding * 2
      )
      : 50;

  ensureSpace(30 + headerHeight + firstRowHeight);

  doc
      .fillColor(colors.secondary)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
          '2. Course Mapping & Recognition',
          margin,
          doc.y,
          { width: pageWidth }
      )
      .moveDown(0.7);

  drawTableHeader();


  // --- TABLE ROWS ---

  mappings.forEach((mapping, index) => {

      const cafoscariHeight = calculateCellHeight(
          mapping.cafoscari_courses,
          'CFU'
      );

      const foreignHeight = calculateCellHeight(
          mapping.foreign_courses,
          'ECTS'
      );

      const rowHeight = Math.max(
          60,
          cafoscariHeight + padding * 2,
          foreignHeight + padding * 2
      );

      const bottom =
          doc.page.height - doc.page.margins.bottom;


      // Add a new page and repeat the table header

      if (doc.y + rowHeight > bottom) {

          doc.addPage();

          drawTableHeader();
      }

      const rowY = doc.y;


      // Alternate row background

      doc
          .rect(margin, rowY, pageWidth, rowHeight)
          .fill(
              index % 2 === 0
                  ? colors.alternate
                  : colors.white
          );


      // Ca' Foscari courses

      drawCourseCell(
          mapping.cafoscari_courses,
          margin,
          rowY,
          'CFU'
      );


      // Foreign courses

      drawCourseCell(
          mapping.foreign_courses,
          margin + columnWidth,
          rowY,
          'ECTS'
      );


      // Row borders

      doc
          .strokeColor(colors.border)
          .lineWidth(0.5)
          .rect(margin, rowY, pageWidth, rowHeight)
          .stroke();

      doc
          .moveTo(margin + columnWidth, rowY)
          .lineTo(
              margin + columnWidth,
              rowY + rowHeight
          )
          .stroke();

      doc.x = margin;
      doc.y = rowY + rowHeight;
  });


  // --- TOTAL CREDITS ROW ---

  const totalHeight = 60;

  const bottom =
      doc.page.height - doc.page.margins.bottom;

  if (doc.y + totalHeight > bottom) {

      doc.addPage();

      drawTableHeader();
  }

  const totalY = doc.y;

  doc
      .rect(margin, totalY, pageWidth, totalHeight)
      .fill(colors.header);


  // Total Ca' Foscari credits

  doc
      .fillColor(colors.muted)
      .font('Helvetica')
      .fontSize(9)
      .text(
          'Total recognized credits',
          margin + padding,
          totalY + padding,
          { width: contentWidth }
      )
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(
          `${total_credits.cafoscari} CFU`,
          margin + padding,
          doc.y + 5,
          { width: contentWidth }
      );


  // Total foreign credits

  doc
      .fillColor(colors.muted)
      .font('Helvetica')
      .fontSize(9)
      .text(
          'Total mobility credits',
          margin + columnWidth + padding,
          totalY + padding,
          { width: contentWidth }
      )
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(
          `${total_credits.foreign} ECTS`,
          margin + columnWidth + padding,
          doc.y + 5,
          { width: contentWidth }
      );


  // Total row borders

  doc
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .rect(margin, totalY, pageWidth, totalHeight)
      .stroke();

  doc
      .moveTo(margin + columnWidth, totalY)
      .lineTo(
          margin + columnWidth,
          totalY + totalHeight
      )
      .stroke();

  doc.x = margin;
  doc.y = totalY + totalHeight;


  // --- DOCUMENT FOOTER ---

  const pages = doc.bufferedPageRange();

  const generatedAt = new Date().toLocaleString('it-IT', {
      timeZone: 'Europe/Rome'
  });

  for (
      let i = pages.start;
      i < pages.start + pages.count;
      i++
  ) {

      doc.switchToPage(i);

      const footerY = doc.page.height - 30;

      const originalBottomMargin =
          doc.page.margins.bottom;

      doc.page.margins.bottom = 0;

      doc
          .strokeColor(colors.border)
          .lineWidth(0.5)
          .moveTo(margin, footerY - 8)
          .lineTo(margin + pageWidth, footerY - 8)
          .stroke();

      doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(colors.muted)
          .text(
              `Generated on ${generatedAt} | ` +
              `Page ${i - pages.start + 1} of ${pages.count}`,
              margin,
              footerY,
              {
                  width: pageWidth,
                  align: 'center',
                  lineBreak: false
              }
          );

      doc.page.margins.bottom = originalBottomMargin;
  }

  return doc;
};

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