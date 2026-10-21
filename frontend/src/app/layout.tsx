import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireConnect - Find Your Dream Job & Hire Top Talent",
  description: "HireConnect is a premier career platform connecting job seekers with leading employers across technology, finance, marketing, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${manrope.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-warmwhite text-charcoal">
        <Providers>
            <Navbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <Footer />
        </Providers>
      </body>
    </html>
  );
}
