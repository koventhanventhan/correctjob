import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password | HireConnect',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
