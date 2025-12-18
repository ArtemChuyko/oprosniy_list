/**
 * Cleanup utility for old uploaded files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { getUploadDir } from './fileStorage';

const RETENTION_DAYS = 7;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Cleans up expired submission folders
 * Deletes folders older than RETENTION_DAYS
 */
export async function cleanupExpiredFiles(): Promise<{
  deleted: number;
  errors: number;
}> {
  const uploadDir = getUploadDir();
  let deleted = 0;
  let errors = 0;

  try {
    // Check if upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      // Directory doesn't exist, nothing to clean
      return { deleted: 0, errors: 0 };
    }

    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderPath = path.join(uploadDir, entry.name);
        try {
          const stats = await fs.stat(folderPath);
          const age = now - stats.mtimeMs;

          if (age > RETENTION_MS) {
            // Delete entire folder
            await fs.rm(folderPath, { recursive: true, force: true });
            deleted++;
          }
        } catch (error) {
          console.error(`Error cleaning up folder ${entry.name}:`, error);
          errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    errors++;
  }

  return { deleted, errors };
}
