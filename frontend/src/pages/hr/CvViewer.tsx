import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

export default function CvViewer() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .exportBlob(`/api/cv/${id}`, { timeout: 30_000 })
      .then((blob) => {
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [id]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] flex-col px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/hr/review/${id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to review
        </Link>
        {blobUrl ? (
          <a
            href={blobUrl}
            download="cv.pdf"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Download PDF
          </a>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">Loading CV…</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">Could not load the CV</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      ) : null}

      {!loading && !error && blobUrl ? (
        <object
          data={blobUrl}
          type="application/pdf"
          className="w-full flex-1 rounded-lg border border-slate-200"
          aria-label="CV PDF viewer"
        >
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="text-sm text-slate-500">
              Your browser cannot display this PDF inline.
            </p>
            <a
              href={blobUrl}
              download="cv.pdf"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Download PDF
            </a>
          </div>
        </object>
      ) : null}
    </div>
  );
}