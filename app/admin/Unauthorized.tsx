/**
 * Unauthorized access page
 */

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <p className="text-sm text-gray-500">
          Please provide a valid admin token via query parameter (?token=...) or header (X-Admin-Token).
        </p>
      </div>
    </div>
  );
}
