/**
 * Email service for sending form submission notifications
 */

import nodemailer from 'nodemailer';
import type { FileMetadata } from './fileStorage';
import path from 'path';
import { promises as fs } from 'fs';

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * Creates nodemailer transporter from environment variables
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

/**
 * Sends email with attachments
 * Returns download links for files that couldn't be attached due to size limits
 */
export async function sendSubmissionEmail(
  formTitle: string,
  submissionId: string,
  excelBuffer: Buffer,
  fileMetadata: Record<string, FileMetadata[]>,
  baseUrl: string
): Promise<{ success: boolean; downloadLinks?: string[] }> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error('OWNER_EMAIL is not configured');
  }

  const transporter = createTransporter();
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';

  // Prepare attachments
  const attachments: EmailAttachment[] = [];
  let totalSize = excelBuffer.length;
  const downloadLinks: string[] = [];

  // Always attach Excel file
  attachments.push({
    filename: `submission-${submissionId}.xlsx`,
    content: excelBuffer,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Try to attach files
  const allFiles: FileMetadata[] = Object.values(fileMetadata).flat();
  for (const fileMeta of allFiles) {
    const fileSize = fileMeta.size;
    if (totalSize + fileSize <= MAX_ATTACHMENT_SIZE) {
      try {
        const fileContent = await fs.readFile(fileMeta.path);
        attachments.push({
          filename: fileMeta.originalName,
          content: fileContent,
        });
        totalSize += fileSize;
      } catch (error) {
        console.error(`Error reading file ${fileMeta.path}:`, error);
        // Add download link instead
        const downloadUrl = `${baseUrl}/api/download/${submissionId}/${fileMeta.filename}`;
        downloadLinks.push(
          `${fileMeta.originalName}: ${downloadUrl}`
        );
      }
    } else {
      // File too large, add download link
      const downloadUrl = `${baseUrl}/api/download/${submissionId}/${fileMeta.filename}`;
      downloadLinks.push(
        `${fileMeta.originalName}: ${downloadUrl}`
      );
    }
  }

  // Build email content
  const subject = `New Form Submission: ${formTitle}`;
  let text = `A new submission has been received for "${formTitle}".\n\n`;
  text += `Submission ID: ${submissionId}\n`;
  text += `Submitted at: ${new Date().toLocaleString()}\n\n`;
  text += 'Please see the attached Excel file for details.';

  let html = `<h2>New Form Submission</h2>`;
  html += `<p><strong>Form:</strong> ${formTitle}</p>`;
  html += `<p><strong>Submission ID:</strong> ${submissionId}</p>`;
  html += `<p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>`;
  html += `<p>Please see the attached Excel file for details.</p>`;

  if (downloadLinks.length > 0) {
    text += '\n\nFiles too large to attach. Download links:\n';
    text += downloadLinks.join('\n');
    html += '<h3>Download Links (files too large to attach):</h3>';
    html += '<ul>';
    downloadLinks.forEach((link) => {
      const [filename, url] = link.split(': ');
      html += `<li><a href="${url}">${filename}</a></li>`;
    });
    html += '</ul>';
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: ownerEmail,
      subject,
      text,
      html,
      attachments,
    });

    return { success: true, downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email notification');
  }
}
