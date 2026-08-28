import { useParams, Link } from "react-router-dom";

export default function Review() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Candidate Review</h1>
      <p className="text-sm text-slate-500">
        Application ID: <span className="font-mono text-slate-700">{id}</span>
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Profile, score breakdown, and decision controls coming soon.
      </div>
      <p className="text-xs text-slate-400">
        <Link to="/hr" className="underline hover:text-slate-600">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}