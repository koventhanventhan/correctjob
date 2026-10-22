import type { Metadata } from 'next';
import EmployerAuthGuard from '@/components/employer/EmployerAuthGuard';

export const metadata: Metadata = {
  title: 'Employer Portal | HireConnect',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerAuthGuard>{children}</EmployerAuthGuard>;
}
