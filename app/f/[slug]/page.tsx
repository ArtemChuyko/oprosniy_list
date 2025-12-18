/**
 * Public form page - /f/[slug]
 * Displays a form based on the slug parameter
 */

import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/lib/forms/storage';

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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}

          {/* TODO: Implement form rendering with sections and questions */}
          <div className="space-y-6">
            {form.sections.map((section) => (
              <div key={section.id} className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                {section.description && (
                  <p className="text-gray-600 mb-4">{section.description}</p>
                )}
                <div className="space-y-4">
                  {section.questions.map((question) => (
                    <div key={question.id}>
                      <label className="block text-sm font-medium mb-1">
                        {question.label}
                        {question.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {/* TODO: Render question input based on question.type */}
                      <div className="mt-1 p-3 border border-gray-300 rounded bg-gray-50">
                        [Question type: {question.type}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* TODO: Add form submission handler */}
          <div className="mt-8">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
