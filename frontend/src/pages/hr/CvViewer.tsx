import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to={`/hr/review/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Back to review
        </Link>
        {blobUrl ? (
          <a
            href={blobUrl}
            download="cv.pdf"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="size-3.5" />
            Download PDF
          </a>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-neutral-400">
          <Loader2 className="size-6 animate-spin text-neutral-900" />
          <p className="text-xs sm:text-sm font-medium">Loading CV…</p>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <div>
            <AlertTitle>Could not load the CV</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {!loading && !error && blobUrl ? (
        <object
          data={blobUrl}
          type="application/pdf"
          className="w-full flex-1 min-h-[75vh] rounded-xl border border-neutral-200 bg-white"
          aria-label="CV PDF viewer"
        >
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="text-sm text-neutral-500">
              Your browser cannot display this PDF inline.
            </p>
            <a
              href={blobUrl}
              download="cv.pdf"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <Download className="size-3.5" />
              Download PDF
            </a>
          </div>
        </object>
      ) : null}
    </div>
  );
}
