import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Advice & Interview Preparation Tips',
  description:
    'Explore expert career advice, resume writing tips, behavioral interview strategies, and salary negotiation guides tailored for professionals in Sri Lanka.',
  alternates: {
    canonical: '/career-advice',
  },
  openGraph: {
    title: 'Career Advice & Interview Preparation Tips | HireConnect',
    description:
      'Explore expert career advice, resume writing tips, behavioral interview strategies, and salary negotiation guides tailored for professionals in Sri Lanka.',
    url: '/career-advice',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Career Advice - HireConnect',
      },
    ],
  },
};

export default function CareerAdviceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
