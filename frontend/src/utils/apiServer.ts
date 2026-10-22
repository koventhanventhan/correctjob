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
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
