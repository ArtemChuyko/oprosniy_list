/**
 * Form submission success page - /f/[slug]/done
 * Shown after successful form submission
 */

import Link from 'next/link';
import { getFormBySlug } from '@/lib/forms/storage';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormDonePage({ params }: PageProps) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[#4A4A4A] font-sans">Спасибо!</h1>
        </div>
      </div>
    </div>
  );
}
