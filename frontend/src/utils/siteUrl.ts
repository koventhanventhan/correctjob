/**
 * Helper to get the canonical site URL from environment configuration.
 * Avoids hardcoding and ensures no trailing slashes.
 */
export function getSiteUrl(): string {
    const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    if (url && url.trim().length > 0) {
        return url.trim().replace(/\/+$/, '');
    }
    return 'http://localhost:3000';
}
