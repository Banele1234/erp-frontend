import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
