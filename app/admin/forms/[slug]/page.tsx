/**
 * Admin form editor page - /admin/forms/[slug]
 * Allows editing or creating forms
 */

import { notFound, redirect } from 'next/navigation';
import { getFormBySlug } from '@/lib/forms/storage';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminFormEditPage({ params }: PageProps) {
  const { slug } = await params;
  const isNew = slug === 'new';
  const form = isNew ? null : await getFormBySlug(slug);

  if (!isNew && !form) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Create New Form' : `Edit: ${form?.title}`}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* TODO: Implement form editor UI */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Form Title
              </label>
              <input
                type="text"
                defaultValue={form?.title || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter form title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Form Slug
              </label>
              <input
                type="text"
                defaultValue={form?.slug || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter form slug (URL-friendly)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                defaultValue={form?.description || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Enter form description"
              />
            </div>

            {/* TODO: Add section/question editor */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Sections & Questions</h2>
              <div className="text-gray-500 text-sm">
                [Form builder UI will be implemented here]
              </div>
              {form && (
                <div className="mt-4 space-y-4">
                  {form.sections.map((section) => (
                    <div key={section.id} className="border p-4 rounded">
                      <h3 className="font-medium">{section.title}</h3>
                      <p className="text-sm text-gray-600">
                        {section.questions.length} question(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Form
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
