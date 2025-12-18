/**
 * File storage utilities for form submissions
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'video/mp4',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4'];

export interface FileMetadata {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

/**
 * Validates file type and size
 */
export function validateFile(
  file: File,
  fileIndex: number = 0
): { valid: boolean; error?: string } {
  // Check file type
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File ${fileIndex + 1}: Invalid file type. Allowed types: JPG, PNG, PDF, MP4`,
    };
  }

  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File ${fileIndex + 1}: Invalid file type. Allowed types: JPG, PNG, PDF, MP4`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File ${fileIndex + 1}: File size exceeds 25MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validates total size of multiple files
 */
export function validateTotalSize(files: File[]): { valid: boolean; error?: string } {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total file size exceeds 100MB limit`,
    };
  }
  return { valid: true };
}

/**
 * Stores uploaded files and returns metadata
 */
export async function storeFiles(
  files: File[],
  requestId: string
): Promise<FileMetadata[]> {
  // Create upload directory for this request
  const requestDir = path.join(UPLOAD_DIR, requestId);
  await fs.mkdir(requestDir, { recursive: true });

  const metadata: FileMetadata[] = [];

  for (const file of files) {
    // Generate unique filename
    const extension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${extension}`;
    const filePath = path.join(requestDir, uniqueFilename);

    // Convert File to Buffer and write
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    metadata.push({
      filename: uniqueFilename,
      originalName: file.name,
      path: filePath,
      size: file.size,
      mimeType: file.type,
    });
  }

  return metadata;
}

/**
 * Gets the upload directory path
 */
export function getUploadDir(): string {
  return UPLOAD_DIR;
}
