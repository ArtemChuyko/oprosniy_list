/**
 * Public form page - /f/[slug]
 * Displays a form based on the slug parameter
 */

import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/lib/forms/storage';
import FormRenderer from './FormRenderer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormPage({ params }: PageProps) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="bg-gray-50 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2 text-[#4A4A4A] font-sans">{form.title}</h1>
          {form.description && (
            <p className="text-[#4A4A4A] font-sans mb-6">{form.description}</p>
          )}

          <FormRenderer form={form} />
        </div>
      </div>
    </div>
  );
}
