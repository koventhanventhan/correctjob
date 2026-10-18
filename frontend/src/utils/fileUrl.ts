const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5189';

export function getFileUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Relative upload path e.g. /uploads/company-logos/...
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${cleanUrl}`;
}
