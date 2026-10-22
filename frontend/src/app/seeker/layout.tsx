import type { Metadata } from 'next';
import SeekerAuthGuard from '@/components/seeker/SeekerAuthGuard';

export const metadata: Metadata = {
  title: 'Job Seeker Portal | HireConnect',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SeekerAuthGuard>{children}</SeekerAuthGuard>;
}
