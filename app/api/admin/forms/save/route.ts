/**
 * API route: POST /api/admin/forms/save
 * Saves or updates a form
 */

import { NextResponse } from 'next/server';
import { saveForm } from '@/lib/forms/storage';
import type { Form } from '@/lib/forms/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const formData = body as Form;

    // TODO: Validate form schema
    // TODO: Validate slug format (URL-friendly)
    // TODO: Check for duplicate slugs (if updating existing form)
    // TODO: Validate sections and questions structure

    await saveForm(formData);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Form saved successfully',
        slug: formData.slug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
