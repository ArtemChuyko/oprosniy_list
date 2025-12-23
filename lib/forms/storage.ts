/**
 * Server helpers for reading/writing JSON forms from data/forms directory
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Form } from './schema';

const FORMS_DIR = path.join(process.cwd(), 'data', 'forms');

/**
 * Read a form by slug from data/forms directory
 */
export async function getFormBySlug(slug: string): Promise<Form | null> {
  try {
    const filePath = path.join(FORMS_DIR, `${slug}.json`);
    const fileContents = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContents) as Form;
  } catch (error) {
    // File doesn't exist or invalid JSON
    return null;
  }
}

/**
 * Get all forms from data/forms directory
 */
export async function getAllForms(): Promise<Form[]> {
  try {
    const files = await fs.readdir(FORMS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const forms: Form[] = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(FORMS_DIR, file);
        const fileContents = await fs.readFile(filePath, 'utf-8');
        const form = JSON.parse(fileContents) as Form;
        forms.push(form);
      } catch (error) {
        // Skip invalid JSON files
        console.error(`Error reading form file ${file}:`, error);
      }
    }
    
    return forms;
  } catch (error) {
    // Directory doesn't exist
    return [];
  }
}

/**
 * Save a form to data/forms directory
 */
export async function saveForm(form: Form): Promise<void> {
  // Ensure directory exists
  await fs.mkdir(FORMS_DIR, { recursive: true });
  
  const filePath = path.join(FORMS_DIR, `${form.slug}.json`);
  const updatedForm = {
    ...form,
    updatedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(filePath, JSON.stringify(updatedForm, null, 2), 'utf-8');
}

/**
 * Delete a form by slug
 */
export async function deleteForm(slug: string): Promise<boolean> {
  try {
    const filePath = path.join(FORMS_DIR, `${slug}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
