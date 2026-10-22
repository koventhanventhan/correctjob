import type { Metadata } from 'next';
import JobsClient from '@/components/jobs/JobsClient';
import { fetchServer } from '@/utils/apiServer';

interface JobsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: JobsPageProps): Promise<Metadata> {
  const params = await searchParams;

  const pageVal = params?.page;
  const pageNum = typeof pageVal === 'string' ? parseInt(pageVal, 10) : 1;
  const isPage2Plus = !isNaN(pageNum) && pageNum > 1;

  const title = isPage2Plus
    ? `Browse Jobs in Sri Lanka - Page ${pageNum}`
    : 'Browse Vacancies & Openings in Sri Lanka';

  const description =
    'Find verified job opportunities across Sri Lanka. Filter by industry, salary in LKR, experience level, and remote flexibility to advance your career.';

  const canonicalPath = isPage2Plus ? `/jobs?page=${pageNum}` : '/jobs';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | HireConnect`,
      description,
      url: canonicalPath,
      type: 'website',
      images: [
        {
          url: '/og-default.png',
          width: 1200,
          height: 630,
          alt: 'Browse Jobs on HireConnect',
        },
      ],
    },
  };
}

export default async function JobsPage() {
  const [initialJobs, initialCategories, initialLocations] = await Promise.all([
    fetchServer('/jobs?page=1&pageSize=12'),
    fetchServer('/categories'),
    fetchServer('/locations'),
  ]);

  return (
    <JobsClient
      initialJobs={initialJobs}
      initialCategories={initialCategories}
      initialLocations={initialLocations}
    />
  );
}
