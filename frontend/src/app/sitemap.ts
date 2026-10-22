import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/utils/siteUrl';
import { fetchServer } from '@/utils/apiServer';

// Revalidate sitemap regularly (60s) so newly published or expired jobs refresh quickly
export const revalidate = 60;

// Persistent cache across requests during runtime to prevent empty sitemaps if API temporarily fails
let cachedJobRoutes: MetadataRoute.Sitemap = [];
let cachedCompanyRoutes: MetadataRoute.Sitemap = [];

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
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    let currentPage = 1;
    const pageSize = 100;
    const maxItems = 50000;
    let totalItems = 0;
    const now = new Date();

    while (totalItems < maxItems) {
      const res = await fetchServer<any>(
        `/jobs?page=${currentPage}&pageSize=${pageSize}&sortBy=newest`,
        { next: { revalidate: 60 } }
      );
      const jobs = res?.data || [];
      if (!Array.isArray(jobs) || jobs.length === 0) break;

      for (const job of jobs) {
        // Exclude closed or expired jobs using real API field job.deadline (expiresAt does not exist)
        const isClosedOrExpired =
          job.status === 'Closed' ||
          job.status === 'Expired' ||
          job.status === 'Rejected' ||
          job.isExpired === true ||
          (job.deadline && new Date(job.deadline) < now);

        if (!isClosedOrExpired && job.id) {
          jobRoutes.push({
            url: `${siteUrl}/jobs/${job.id}`,
            lastModified: new Date(job.updatedAt || job.createdAt || now),
            changeFrequency: 'daily',
            priority: 0.8,
          });
          totalItems++;
        }
      }

      const totalPages = res?.totalPages || res?.pagination?.totalPages || 1;
      if (currentPage >= totalPages) break;
      currentPage++;
    }

    if (jobRoutes.length > 0) {
      cachedJobRoutes = jobRoutes;
    }
  } catch (err) {
    // If API is down or fails, fallback to previous cached sitemap so build / request succeeds
    console.warn('[sitemap] Failed to fetch jobs for sitemap, falling back to cached routes:', err);
    if (cachedJobRoutes.length > 0) {
      jobRoutes = cachedJobRoutes;
    }
  }

  // Fetch approved companies
  let companyRoutes: MetadataRoute.Sitemap = [];
  try {
    let companyPage = 1;
    const companyPageSize = 100;

    while (companyPage <= 10) {
      const res = await fetchServer<any>(
        `/companies?page=${companyPage}&pageSize=${companyPageSize}`,
        { next: { revalidate: 60 } }
      );
      const companies = res?.data || [];
      if (!Array.isArray(companies) || companies.length === 0) break;

      for (const company of companies) {
        // Only include approved companies with a valid ID
        if (company.isApproved !== false && company.id) {
          companyRoutes.push({
            url: `${siteUrl}/companies/${company.id}`,
            lastModified: new Date(company.updatedAt || company.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }

      const totalCount = res?.totalCount || 0;
      if (companyPage * companyPageSize >= totalCount) break;
      companyPage++;
    }

    if (companyRoutes.length > 0) {
      cachedCompanyRoutes = companyRoutes;
    }
  } catch (err) {
    console.warn('[sitemap] Failed to fetch companies for sitemap, falling back to cached routes:', err);
    if (cachedCompanyRoutes.length > 0) {
      companyRoutes = cachedCompanyRoutes;
    }
  }

  return [...staticRoutes, ...jobRoutes, ...companyRoutes];
}
