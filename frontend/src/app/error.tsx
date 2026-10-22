"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LuTriangleAlert, LuRefreshCw, LuHouse } from "react-icons/lu";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client error to monitoring console in dev
    console.error("Unhandled client error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <meta name="robots" content="noindex, nofollow" />
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-red-100">
          <LuTriangleAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
          Application Error
        </p>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal tracking-tight mb-3">
          Something went wrong
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          An unexpected error occurred while rendering this page. Our team has been notified.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange hover:bg-orange/90 text-white font-medium rounded-md shadow-xs transition-colors cursor-pointer min-h-[40px]"
            aria-label="Try loading this page again"
          >
            <LuRefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-charcoal font-medium rounded-md border border-gray-300 shadow-xs transition-colors min-h-[40px]"
            aria-label="Navigate back to homepage"
          >
            <LuHouse className="w-4 h-4 text-gray-500" aria-hidden="true" />
            Back to Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-gray-400 font-mono">
            Error Reference ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
