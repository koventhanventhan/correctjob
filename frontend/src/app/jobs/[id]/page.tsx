import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JobDetailClient from '@/components/jobs/JobDetailClient';
import { fetchServer } from '@/utils/apiServer';
import { getSiteUrl } from '@/utils/siteUrl';
import { getFileUrl } from '@/utils/fileUrl';

interface JobPageProps {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapEmploymentType(type?: string): string {
  if (!type) return 'FULL_TIME';
  const t = type.toLowerCase();
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('contract')) return 'CONTRACTOR';
  if (t.includes('intern')) return 'INTERN';
  if (t.includes('temp') || t.includes('casual')) return 'TEMPORARY';
  return 'FULL_TIME';
}

function isJobClosed(job: any): boolean {
  if (!job) return false;
  return (
    job.status === 'Closed' ||
    job.status === 'Expired' ||
    job.status === 'Rejected' ||
    (job.expiresAt && new Date(job.expiresAt) < new Date())
  );
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchServer<any>(`/jobs/${id}`);

  if (!job) {
    return {
      title: 'Job Not Found',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const companyName = job.company?.companyName || 'HireConnect Employer';
  const title = `${job.title} at ${companyName}`;

  const plainDesc = stripHtml(job.description || '');
  let description = plainDesc;
  if (description.length < 120) {
    description = `${description ? `${description} ` : ''}Apply now on HireConnect for verified career vacancies with transparent salaries across Sri Lanka.`.trim();
  }
  if (description.length > 158) {
    description = `${description.slice(0, 155)}...`;
  }

  const closed = isJobClosed(job);
  const logoUrl = job.company?.logoUrl
    ? getFileUrl(job.company.logoUrl)
    : `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/jobs/${id}`,
    },
    robots: closed
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: `${title} | HireConnect`,
      description,
      url: `/jobs/${id}`,
      type: 'website',
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: `${companyName} logo`,
        },
      ],
    },
  };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { id } = await params;
  const job = await fetchServer<any>(`/jobs/${id}`);

  if (!job) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const companyName = job.company?.companyName || 'HireConnect Employer';
  const logoUrl = job.company?.logoUrl
    ? getFileUrl(job.company.logoUrl)
    : `${siteUrl}/og-default.png`;
  const isRemote =
    job.location?.toLowerCase().includes('remote') ||
    job.jobType?.toLowerCase().includes('remote');

  const jobPostingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || '',
    datePosted: job.publishedAt || job.createdAt,
    employmentType: mapEmploymentType(job.jobType),
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      logo: logoUrl,
      sameAs: job.company?.websiteUrl || undefined,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Colombo',
        addressCountry: 'LK',
      },
    },
    directApply: true,
    identifier: {
      '@type': 'PropertyValue',
      name: 'HireConnect',
      value: job.id.toString(),
    },
  };

  if (job.applicationDeadline || job.expiresAt) {
    jobPostingSchema.validThrough = job.applicationDeadline || job.expiresAt;
  }

  if (isRemote) {
    jobPostingSchema.jobLocationType = 'TELECOMMUTE';
  }

  if (job.salaryMin || job.salaryMax) {
    const period = (job.salaryPeriod || 'MONTHLY').toUpperCase();
    const unitText =
      period === 'HOURLY' ? 'HOUR' : period === 'YEARLY' ? 'YEAR' : 'MONTH';

    jobPostingSchema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'LKR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin || job.salaryMax,
        maxValue: job.salaryMax || job.salaryMin,
        unitText,
      },
    };
  }

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
        name: 'Jobs',
        item: `${siteUrl}/jobs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: job.title,
        item: `${siteUrl}/jobs/${id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobPostingSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbsSchema).replace(/</g, '\\u003c'),
        }}
      />
      <JobDetailClient initialJob={job} />
    </>
  );
}
