/**
 * Admin form editor page - /admin/forms/[slug]
 * Allows editing or creating forms
 */

import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/lib/forms/storage';
import Link from 'next/link';
import Unauthorized from '../../Unauthorized';
import FormEditor from './FormEditor';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminFormEditPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const searchParamsData = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;
  
  // Check auth
  if (adminSecret && searchParamsData.token !== adminSecret) {
    return <Unauthorized />;
  }

  const isNew = slug === 'new';
  const form = isNew ? null : await getFormBySlug(slug);

  if (!isNew && !form) {
    notFound();
  }

  const token = searchParamsData.token || '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Link
            href={`/admin${token ? `?token=${token}` : ''}`}
            className="text-blue-600 hover:underline mb-4 inline-block font-sans"
          >
            ← Назад к панели администратора
          </Link>
          <h1 className="text-3xl font-bold text-[#4A4A4A] font-sans">
            {isNew ? 'Создать новую форму' : `Редактировать: ${form?.title}`}
          </h1>
        </div>

        <FormEditor form={form} token={token} />
      </div>
    </div>
  );
}
