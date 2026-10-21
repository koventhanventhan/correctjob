export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16" role="status" aria-label="Loading content">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-orange/20" />
        <div className="absolute inset-0 rounded-full border-4 border-orange border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-gray-500 animate-pulse">Loading HireConnect...</p>
      <span className="sr-only">Please wait, content is loading.</span>
    </div>
  );
}
