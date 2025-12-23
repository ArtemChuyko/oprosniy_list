/**
 * API route: POST /api/submit/[slug]
 * Handles form submission with file uploads
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getFormBySlug } from '@/lib/forms/storage';
import {
  validateFile,
  validateTotalSize,
  storeFiles,
  type FileMetadata,
} from '@/lib/forms/fileStorage';
import { generateExcelReport } from '@/lib/forms/excelGenerator';
import { sendSubmissionEmail } from '@/lib/forms/emailService';
import { cleanupExpiredFiles } from '@/lib/forms/cleanup';
import type { FormSubmission } from '@/lib/forms/schema';
import type { FormData } from '@/lib/forms/formData';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const form = await getFormBySlug(slug);

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    
    // Extract JSON answers
    const answersJson = formData.get('answers');
    if (!answersJson || typeof answersJson !== 'string') {
      return NextResponse.json(
        { error: 'Invalid form data: answers missing' },
        { status: 400 }
      );
    }

    let answers: FormData;
    try {
      answers = JSON.parse(answersJson) as FormData;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in answers' },
        { status: 400 }
      );
    }

    // Extract files
    const filesByQuestion: Record<string, File[]> = {};
    const fileEntries: [string, File][] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const questionId = key.replace('file_', '');
        if (!filesByQuestion[questionId]) {
          filesByQuestion[questionId] = [];
        }
        filesByQuestion[questionId].push(value);
        fileEntries.push([questionId, value]);
      }
    }

    // Validate files
    const allFiles: File[] = [];
    for (const [questionId, files] of Object.entries(filesByQuestion)) {
      const question = form.sections
        .flatMap((s) => s.questions)
        .find((q) => q.id === questionId);

      if (!question || question.type !== 'file') {
        return NextResponse.json(
          { error: `Invalid file upload for question ${questionId}` },
          { status: 400 }
        );
      }

      // Check if multiple files are allowed
      if (!question.multiple && files.length > 1) {
        return NextResponse.json(
          { error: `Question "${question.label}" only allows a single file` },
          { status: 400 }
        );
      }

      // Validate each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file, i);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            { status: 400 }
          );
        }
        allFiles.push(file);
      }
    }

    // Validate total size
    if (allFiles.length > 0) {
      const totalSizeValidation = validateTotalSize(allFiles);
      if (!totalSizeValidation.valid) {
        return NextResponse.json(
          { error: totalSizeValidation.error },
          { status: 400 }
        );
      }
    }

    // Generate submission ID
    const submissionId = randomUUID();

    // Store files
    const fileMetadata: Record<string, FileMetadata[]> = {};
    if (allFiles.length > 0) {
      const storedFiles = await storeFiles(allFiles, submissionId);
      
      // Group files by question ID
      let fileIndex = 0;
      for (const [questionId, files] of Object.entries(filesByQuestion)) {
        fileMetadata[questionId] = storedFiles.slice(
          fileIndex,
          fileIndex + files.length
        );
        fileIndex += files.length;
      }
    }

    const submission: FormSubmission = {
      formId: form.id,
      formSlug: form.slug,
      answers: answers || {},
      submittedAt: new Date().toISOString(),
    };

    // Generate Excel report
    let excelBuffer: Buffer;
    try {
      excelBuffer = await generateExcelReport(form, {
        answers,
        fileMetadata,
        submittedAt: submission.submittedAt,
      });
    } catch (error) {
      console.error('Error generating Excel report:', error);
      // Continue without Excel if generation fails
      excelBuffer = Buffer.alloc(0);
    }

    // Send email notification
    let emailSent = false;
    let downloadLinks: string[] | undefined;
    if (process.env.OWNER_EMAIL) {
      try {
        // Get base URL from request
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        const emailResult = await sendSubmissionEmail(
          form.title,
          submissionId,
          excelBuffer,
          fileMetadata,
          baseUrl
        );
        emailSent = emailResult.success;
        downloadLinks = emailResult.downloadLinks;
      } catch (error) {
        console.error('Error sending email:', error);
        // Don't fail the submission if email fails
      }
    }

    // Cleanup old files (run asynchronously, don't wait)
    cleanupExpiredFiles().catch((error) => {
      console.error('Error during cleanup:', error);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Form submitted successfully',
        submissionId,
        files: fileMetadata,
        emailSent,
        downloadLinks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting form:', error);
    
    // Provide friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'File storage error. Please try again or contact support.' },
          { status: 500 }
        );
      }
    }

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An error occurred while submitting the form. Please try again.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
