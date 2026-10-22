import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Professional Account',
  description:
    'Log in to HireConnect to manage job applications, explore career opportunities, post vacancies, and connect with top employers across Sri Lanka.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In to Your Professional Account | HireConnect',
    description:
      'Log in to HireConnect to manage job applications, explore career opportunities, post vacancies, and connect with top employers across Sri Lanka.',
    url: '/login',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Sign In to HireConnect',
      },
    ],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
