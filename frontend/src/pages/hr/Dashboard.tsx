import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
      <p className="text-slate-500 text-sm">
        Review, screen, and manage candidate applications.
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Candidate list and screening overview coming soon.
      </div>
      <p className="text-xs text-slate-400">
        <Link to="/" className="underline hover:text-slate-600">
          Back to home
        </Link>
      </p>
    </div>
  );
}