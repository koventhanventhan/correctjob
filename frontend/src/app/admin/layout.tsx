import type { Metadata } from 'next';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Admin Portal | HireConnect',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
