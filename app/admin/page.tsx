/**
 * Admin dashboard page - /admin
 * Lists all available forms
 */

import Link from 'next/link';
import { getAllForms } from '@/lib/forms/storage';
import Unauthorized from './Unauthorized';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;
  
  // Check auth
  if (adminSecret && params.token !== adminSecret) {
    return <Unauthorized />;
  }

  const forms = await getAllForms();
  const token = params.token || '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link
            href={`/admin/forms/new${token ? `?token=${token}` : ''}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Form
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {forms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No forms found. Create your first form to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {forms.map((form) => (
                <div key={form.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        {form.title}
                      </h2>
                      {form.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {form.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Slug: {form.slug}</span>
                        <span>Sections: {form.sections.length}</span>
                        {form.updatedAt && (
                          <span>
                            Updated: {new Date(form.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/forms/${form.slug}${token ? `?token=${token}` : ''}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/f/${form.slug}`}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        target="_blank"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TODO: Add form statistics, submission counts, etc. */}
      </div>
    </div>
  );
}
