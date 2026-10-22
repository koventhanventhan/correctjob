import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us: Career Opportunities in Sri Lanka',
  description:
    "Learn about HireConnect's mission to empower job seekers and companies across Sri Lanka with transparent job listings and smart career recruitment tools.",
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us: Career Opportunities in Sri Lanka | HireConnect',
    description:
      "Learn about HireConnect's mission to empower job seekers and companies across Sri Lanka with transparent job listings and smart career recruitment tools.",
    url: '/about',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'About HireConnect',
      },
    ],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
