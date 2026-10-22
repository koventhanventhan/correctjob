import Link from "next/link";
import { LuSearchX, LuBriefcase, LuHouse } from "react-icons/lu";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange/10 text-orange rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-orange/20">
          <LuSearchX className="w-8 h-8" aria-hidden="true" />
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-orange mb-2">
          404 Error
        </p>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          The page or resource you are looking for doesn&apos;t exist, has been moved,
          or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange hover:bg-orange/90 text-white font-medium rounded-md shadow-xs transition-colors min-h-[40px]"
            aria-label="Return to HireConnect homepage"
          >
            <LuHouse className="w-4 h-4" aria-hidden="true" />
            Home Page
          </Link>

          <Link
            href="/jobs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-charcoal font-medium rounded-md border border-gray-300 shadow-xs transition-colors min-h-[40px]"
            aria-label="Browse available jobs"
          >
            <LuBriefcase className="w-4 h-4 text-gray-500" aria-hidden="true" />
            Browse Jobs
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need assistance? Feel free to{" "}
            <Link href="/contact" className="text-orange hover:underline font-medium">
              contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
