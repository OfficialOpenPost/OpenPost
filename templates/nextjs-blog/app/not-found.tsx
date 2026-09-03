import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-24 text-center space-y-4">
      <div className="text-6xl font-extrabold text-gray-100 font-display">404</div>
      <h2 className="text-xl font-bold text-gray-900">Page not found</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/blog"
        className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors mt-2"
      >
        Browse articles
      </Link>
    </div>
  );
}
