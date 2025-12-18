/**
 * API route: POST /api/admin/forms/save
 * Saves or updates a form
 */

import { NextResponse } from 'next/server';
import { saveForm, getFormBySlug } from '@/lib/forms/storage';
import type { Form } from '@/lib/forms/schema';

export async function POST(request: Request) {
  try {
    // Check admin token
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      const token = request.headers.get('X-Admin-Token');
      if (token !== adminSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const formData = body as Form;

    // Validate required fields
    if (!formData.slug || !formData.title) {
      return NextResponse.json(
        { error: 'Form slug and title are required' },
        { status: 400 }
      );
    }

    // Validate slug format (URL-friendly)
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check for duplicate slug (if creating new form)
    const existingForm = await getFormBySlug(formData.slug);
    if (existingForm && existingForm.id !== formData.id) {
      return NextResponse.json(
        { error: 'A form with this slug already exists' },
        { status: 400 }
      );
    }

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
