import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Hiring Companies & Employer Profiles',
  description:
    'Explore leading companies and top employers in Sri Lanka. Read verified company profiles, culture reviews, office locations, and open job vacancies.',
  alternates: {
    canonical: '/companies',
  },
  openGraph: {
    title: 'Top Hiring Companies & Employer Profiles | HireConnect',
    description:
      'Explore leading companies and top employers in Sri Lanka. Read verified company profiles, culture reviews, office locations, and open job vacancies.',
    url: '/companies',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Hiring Companies in Sri Lanka - HireConnect',
      },
    ],
  },
};

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
