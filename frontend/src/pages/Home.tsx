import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">
        AI-Assisted HR Recruitment Screening
      </h1>
      <p className="text-slate-500 text-sm">
        Automated CV processing, transparent scoring, human-in-the-loop decisions.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/apply"
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Apply for a Position
        </Link>
        <Link
          to="/hr"
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          HR Dashboard
        </Link>
      </div>
    </div>
  );
}