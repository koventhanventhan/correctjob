/**
 * Helper to get the canonical site URL from environment configuration.
 * Avoids hardcoding and ensures no trailing slashes.
 *
 * In production (NODE_ENV=production), NEXT_PUBLIC_SITE_URL is strictly required.
 * If missing, an error is thrown to prevent production builds with invalid localhost metadata.
 * Localhost fallback is ONLY permitted in development / test environments.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (url && url.trim().length > 0) {
    return url.trim().replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[CRITICAL] NEXT_PUBLIC_SITE_URL is required in production environment. Please configure it in your environment variables (e.g. NEXT_PUBLIC_SITE_URL=https://hireconnect.lk).'
    );
  }

  return 'http://localhost:3000';
}
