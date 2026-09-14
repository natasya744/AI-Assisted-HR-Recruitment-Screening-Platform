import { useState } from "react";
import {
  Mail,
  Copy,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { EmailDraft } from "@/lib/types";

export default function EmailDraftCard({
  applicationId,
}: {
  applicationId: string;
}) {
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"subject" | "body" | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const result = await api.post<EmailDraft>(
        `/api/hr/applications/${applicationId}/email-draft`,
      );
      setDraft(result);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-sky-600" />
          Email Draft
        </CardTitle>
        <CardDescription>
          Generate an AI-crafted email subject and body to send to the candidate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draft && !loading && !error && (
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 hover:shadow-md transition-all"
          >
            <FileText className="size-3.5" />
            <span>Generate Email Draft</span>
          </button>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-sky-600" />
            <span>Generating email draft…</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">Failed to generate draft</p>
            <p className="mt-0.5 break-words">{error}</p>
          </div>
        )}

        {draft && (
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Subject
                </p>
                <button
                  onClick={() => copyToClipboard(draft.email_subject, "subject")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {copiedField === "subject" ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedField === "subject" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-medium text-foreground">
                {draft.email_subject}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Body
                </p>
                <button
                  onClick={() => copyToClipboard(draft.email_body, "body")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {copiedField === "body" ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedField === "body" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground whitespace-pre-line leading-relaxed">
                {draft.email_body}
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <FileText className="size-3" />
              )}
              <span>Regenerate</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}