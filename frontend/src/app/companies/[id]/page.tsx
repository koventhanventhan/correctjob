import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompanyDetailClient from '@/components/companies/CompanyDetailClient';
import { fetchServer } from '@/utils/apiServer';
import { getSiteUrl } from '@/utils/siteUrl';
import { getFileUrl } from '@/utils/fileUrl';

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await fetchServer<any>(`/companies/${id}`);

  if (!company) {
    return {
      title: 'Company Not Found',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const fullTitle = `${company.companyName} Jobs & Profile`.trim();
  const maxTitleLength = 46; // 46 + 14 (' | HireConnect') = 60
  const title =
    fullTitle.length > maxTitleLength
      ? `${fullTitle.slice(0, maxTitleLength - 3).trim()}...`
      : fullTitle;
  const rawDesc = stripHtml(company.description || '');
  let description = rawDesc;
  if (!description || description.length < 120) {
    description = `${description ? `${description} ` : ''}Explore verified company culture, reviews, office locations, and open job vacancies in Sri Lanka on HireConnect.`.trim();
  }
  if (description.length > 158) {
    description = `${description.slice(0, 155)}...`;
  }

  const logoUrl = company.logoUrl
    ? getFileUrl(company.logoUrl)
    : `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/companies/${id}`,
    },
    openGraph: {
      title: `${title} | HireConnect`,
      description,
      url: `/companies/${id}`,
      type: 'website',
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: `${company.companyName} logo`,
        },
      ],
    },
  };
}

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const company = await fetchServer<any>(`/companies/${id}`);

  if (!company) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const logoUrl = company.logoUrl
    ? getFileUrl(company.logoUrl)
    : `${siteUrl}/og-default.png`;

  const sameAs = [
    company.linkedinUrl,
    company.twitterUrl,
    company.facebookUrl,
  ].filter(Boolean);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.companyName,
    url: company.website
      ? company.website.startsWith('http')
        ? company.website
        : `https://${company.website}`
      : `${siteUrl}/companies/${id}`,
    logo: logoUrl,
    description: company.description || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.location || 'Colombo',
      addressCountry: 'LK',
    },
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Companies',
        item: `${siteUrl}/companies`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: company.companyName,
        item: `${siteUrl}/companies/${id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbsSchema).replace(/</g, '\\u003c'),
        }}
      />
      <CompanyDetailClient initialCompany={company} />
    </>
  );
}
