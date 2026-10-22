export function getApiUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5189/api'
  ).replace(/\/$/, '');
}

export async function fetchServer<T = any>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      next: { revalidate: 300, ...(options?.next || {}) },
    });

    // 404 Not Found or 403 Forbidden return null so callers can trigger notFound()
    if (res.status === 404 || res.status === 403) {
      return null;
    }

    // 5xx or other HTTP errors throw an error to invoke Next.js error boundary (500)
    if (!res.ok) {
      throw new Error(`API error HTTP ${res.status}: ${res.statusText} for ${path}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    // Network errors, connection refused, or thrown 5xx errors rethrown so Next.js renders 500 page
    throw error;
  }
}
