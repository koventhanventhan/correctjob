import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/utils/siteUrl';
import { fetchServer } from '@/utils/apiServer';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/salary-guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/career-advice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Fetch published, active jobs (up to 50k max)
  const jobRoutes: MetadataRoute.Sitemap = [];
  try {
    let currentPage = 1;
    const pageSize = 100;
    const maxItems = 50000;
    let totalItems = 0;
    const now = new Date();

    while (totalItems < maxItems) {
      const res = await fetchServer<any>(
        `/jobs?page=${currentPage}&pageSize=${pageSize}&sortBy=newest`
      );
      const jobs = res?.data || [];
      if (!Array.isArray(jobs) || jobs.length === 0) break;

      for (const job of jobs) {
        // Exclude closed or expired jobs
        const isClosed =
          job.status === 'Closed' ||
          job.status === 'Expired' ||
          job.status === 'Rejected' ||
          (job.expiresAt && new Date(job.expiresAt) < now);

        if (!isClosed) {
          jobRoutes.push({
            url: `${siteUrl}/jobs/${job.id}`,
            lastModified: new Date(job.updatedAt || job.createdAt || now),
            changeFrequency: 'daily',
            priority: 0.8,
          });
          totalItems++;
        }
      }

      const totalPages = res?.pagination?.totalPages || 1;
      if (currentPage >= totalPages) break;
      currentPage++;
    }
  } catch {
    // If jobs fetch fails, continue with other routes
  }

  // Fetch approved companies
  const companyRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetchServer<any>('/companies?pageSize=100');
    const companies = res?.data || [];
    if (Array.isArray(companies)) {
      for (const company of companies) {
        if (company.isApproved !== false) {
          companyRoutes.push({
            url: `${siteUrl}/companies/${company.id}`,
            lastModified: new Date(company.updatedAt || company.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // If company fetch fails, continue
  }

  return [...staticRoutes, ...jobRoutes, ...companyRoutes];
}
