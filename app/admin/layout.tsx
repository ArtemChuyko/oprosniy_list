/**
 * Admin layout - auth check is done in individual pages
 * to access searchParams
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
