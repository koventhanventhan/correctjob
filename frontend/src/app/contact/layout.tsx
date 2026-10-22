import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Support & Inquiries in Sri Lanka',
  description:
    'Get in touch with the HireConnect team for technical support, employer partnerships, job advertising, or general inquiries in Sri Lanka.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Support & Inquiries in Sri Lanka | HireConnect',
    description:
      'Get in touch with the HireConnect team for technical support, employer partnerships, job advertising, or general inquiries in Sri Lanka.',
    url: '/contact',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Contact HireConnect',
      },
    ],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
