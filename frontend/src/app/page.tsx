import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { getSiteUrl } from '@/utils/siteUrl';

export const metadata: Metadata = {
  title: 'Find Jobs & Build Your Career in Sri Lanka | HireConnect',
  description:
    'Discover verified job vacancies in Sri Lanka across technology, finance, marketing, and more. Apply directly with transparent LKR salaries on HireConnect.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Find Jobs & Build Your Career in Sri Lanka | HireConnect',
    description:
      'Discover verified job vacancies in Sri Lanka across technology, finance, marketing, and more. Apply directly with transparent LKR salaries on HireConnect.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'HireConnect - Jobs & Careers in Sri Lanka',
      },
    ],
  },
};

export default function HomePage() {
  const siteUrl = getSiteUrl();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HireConnect',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/jobs?keyword={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HireConnect',
    url: siteUrl,
    logo: `${siteUrl}/og-default.png`,
    description:
      "Sri Lanka's leading job board connecting skilled professionals with top verified employers.",
    sameAs: [
      'https://www.linkedin.com/company/hireconnect-lk',
      'https://www.facebook.com/hireconnectlk',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
        }}
      />
      <HomeClient />
    </>
  );
}
