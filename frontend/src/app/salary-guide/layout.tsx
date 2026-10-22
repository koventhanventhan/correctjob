import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sri Lanka Salary Guide 2026 Benchmarks',
  description:
    'Explore Sri Lanka salary benchmarks, compensation trends, and competitive LKR pay scales for tech, marketing, and business roles on HireConnect.',
  alternates: {
    canonical: '/salary-guide',
  },
  openGraph: {
    title: 'Sri Lanka Salary Guide 2026 Benchmarks | HireConnect',
    description:
      'Explore Sri Lanka salary benchmarks, compensation trends, and competitive LKR pay scales for tech, marketing, and business roles on HireConnect.',
    url: '/salary-guide',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Sri Lanka Salary Guide - HireConnect',
      },
    ],
  },
};

export default function SalaryGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
