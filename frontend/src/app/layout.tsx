import type { Metadata, Viewport } from "next";
import { Outfit, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getSiteUrl } from "@/utils/siteUrl";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HireConnect - Jobs & Careers in Sri Lanka",
    template: "%s | HireConnect",
  },
  description:
    "Discover top career opportunities across Sri Lanka on HireConnect. Search thousands of verified jobs, explore leading companies, and apply online today.",
  openGraph: {
    type: "website",
    siteName: "HireConnect",
    locale: "en_LK",
    url: siteUrl,
    title: "HireConnect - Jobs & Careers in Sri Lanka",
    description:
      "Discover top career opportunities across Sri Lanka on HireConnect. Search thousands of verified jobs, explore leading companies, and apply online today.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "HireConnect - Sri Lanka's Premier Career Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireConnect - Jobs & Careers in Sri Lanka",
    description:
      "Discover top career opportunities across Sri Lanka on HireConnect. Search thousands of verified jobs, explore leading companies, and apply online today.",
    images: ["/og-default.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#F4791F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${manrope.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-warmwhite text-charcoal">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange focus:text-white focus:rounded-md focus:shadow-md focus:outline-none font-semibold text-sm"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
