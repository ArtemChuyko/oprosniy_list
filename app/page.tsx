import Link from "next/link";
import { getAllForms } from "@/lib/forms/storage";

export default async function Home() {
  let forms: Array<{ slug: string; title: string }> = [];
  
  try {
    const allForms = await getAllForms();
    forms = allForms.map((form) => ({
      slug: form.slug,
      title: form.title,
    }));
  } catch (error) {
    console.error("Error loading forms:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-[#4A4A4A] font-sans mb-4">
            Опросные листы
          </h1>
          <p className="text-lg text-[#4A4A4A] font-sans mb-8">
            Выберите опросный лист для заполнения
          </p>
          
          {forms.length > 0 ? (
            <div className="space-y-4">
              {forms.map((form) => (
                <Link
                  key={form.slug}
                  href={`/f/${form.slug}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-[#4A4A4A] font-sans">
                    {form.title}
                  </h2>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-sans">
                Опросные листы не найдены
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
