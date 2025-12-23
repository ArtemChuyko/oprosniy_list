/**
 * Unauthorized access page
 */

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#4A4A4A] font-sans mb-4">Не авторизован</h1>
        <p className="text-[#4A4A4A] font-sans mb-6">
          У вас нет прав доступа к этой странице.
        </p>
        <p className="text-sm text-[#4A4A4A] font-sans">
          Пожалуйста, предоставьте действительный токен администратора через параметр запроса (?token=...) или заголовок (X-Admin-Token).
        </p>
      </div>
    </div>
  );
}
