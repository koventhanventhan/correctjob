import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/utils/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/employer/',
          '/seeker/',
          '/chat/',
          '/api/',
          '/change-password',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
