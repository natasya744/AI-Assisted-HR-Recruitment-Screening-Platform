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
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
          <Mail className="size-4 text-neutral-700" />
          Email Draft
        </CardTitle>
        <CardDescription>
          Generate an AI-crafted email subject and body to send to the candidate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draft && !loading && !error && (
          <Button onClick={handleGenerate} size="sm">
            <FileText className="size-3.5" />
            <span>Generate Email Draft</span>
          </Button>
        )}

        {loading && (
          <div className="flex items-center gap-2.5 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin text-neutral-900" />
            <span>Generating email draft…</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to generate draft</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </Alert>
        )}

        {draft && (
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Subject
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => copyToClipboard(draft.email_subject, "subject")}
                >
                  {copiedField === "subject" ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedField === "subject" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 text-sm font-medium text-neutral-950">
                {draft.email_subject}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Body
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => copyToClipboard(draft.email_body, "body")}
                >
                  {copiedField === "body" ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedField === "body" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-sm text-neutral-800 whitespace-pre-line leading-relaxed">
                {draft.email_body}
              </div>
            </div>

            {/* Regenerate */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              <span>Regenerate</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
