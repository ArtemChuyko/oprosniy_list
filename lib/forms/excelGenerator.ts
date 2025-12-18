/**
 * Excel report generation for form submissions
 */

import ExcelJS from 'exceljs';
import type { Form } from './schema';
import type { FileMetadata } from './fileStorage';

interface SubmissionData {
  answers: Record<string, any>;
  fileMetadata: Record<string, FileMetadata[]>;
  submittedAt: string;
}

/**
 * Formats answer value for Excel display
 */
function formatAnswer(
  value: any,
  questionType: string,
  fileMetadata?: FileMetadata[]
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  switch (questionType) {
    case 'checkbox':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value ? 'Yes' : 'No';

    case 'file':
      if (fileMetadata && fileMetadata.length > 0) {
        const filenames = fileMetadata.map((f) => f.originalName).join(', ');
        return `${filenames} (attached)`;
      }
      return 'No files uploaded';

    case 'date':
      return String(value);

    case 'number':
      return String(value);

    default:
      return String(value);
  }
}

/**
 * Extracts specific fields from answers by question ID or label pattern
 */
function extractField(
  answers: Record<string, any>,
  form: Form,
  pattern: string | ((label: string) => boolean)
): string {
  const question = form.sections
    .flatMap((s) => s.questions)
    .find((q) => {
      if (typeof pattern === 'string') {
        return q.id === pattern || q.label.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern(q.label);
    });

  if (!question) {
    return 'N/A';
  }

  const value = answers[question.id];
  if (value === undefined || value === null || value === '') {
    return 'N/A';
  }
  return String(value);
}

/**
 * Generates Excel report from form submission
 */
export async function generateExcelReport(
  form: Form,
  submission: SubmissionData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Form Submission');

  // Header row
  worksheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 50 },
  ];

  // Extract specific fields first (by label pattern)
  const name = extractField(submission.answers, form, (label) =>
    label.toLowerCase().includes('name') && !label.toLowerCase().includes('signature')
  );
  const phone = extractField(submission.answers, form, (label) =>
    label.toLowerCase().includes('phone')
  );
  
  // Find consent checkbox
  const consentQuestion = form.sections
    .flatMap((s) => s.questions)
    .find((q) =>
      q.type === 'checkbox' &&
      (q.label.toLowerCase().includes('consent') ||
        q.label.toLowerCase().includes('agree') ||
        q.label.toLowerCase().includes('accept'))
    );
  const consent = consentQuestion && submission.answers[consentQuestion.id] ? 'Yes' : 'No';
  
  const signature = extractField(submission.answers, form, (label) =>
    label.toLowerCase().includes('signature') || label.toLowerCase().includes('sign')
  );
  const timestamp = new Date(submission.submittedAt).toLocaleString();

  // Add summary section
  worksheet.addRow({ field: 'Name', value: name });
  worksheet.addRow({ field: 'Phone', value: phone });
  worksheet.addRow({ field: 'Consent', value: consent });
  worksheet.addRow({ field: 'Signature', value: signature });
  worksheet.addRow({ field: 'Submitted At', value: timestamp });
  worksheet.addRow({}); // Empty row

  // Add questions table
  worksheet.addRow({ field: 'Section', value: 'Question' });
  worksheet.addRow({ field: '---', value: '---' });

  form.sections.forEach((section) => {
    section.questions.forEach((question) => {
      const answer = submission.answers[question.id];
      const fileMeta = submission.fileMetadata[question.id];

      // Skip if no answer and no files
      if (
        (answer === undefined || answer === null || answer === '') &&
        (!fileMeta || fileMeta.length === 0)
      ) {
        return;
      }

      const formattedAnswer = formatAnswer(answer, question.type, fileMeta);
      worksheet.addRow({
        field: section.title,
        value: `${question.label}: ${formattedAnswer}`,
      });
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
