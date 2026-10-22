import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Professional Account Today',
  description:
    'Register for HireConnect today to apply for top jobs in Sri Lanka or post vacancies and hire verified professionals across diverse industries.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Create Your Professional Account Today | HireConnect',
    description:
      'Register for HireConnect today to apply for top jobs in Sri Lanka or post vacancies and hire verified professionals across diverse industries.',
    url: '/register',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Create HireConnect Account',
      },
    ],
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
