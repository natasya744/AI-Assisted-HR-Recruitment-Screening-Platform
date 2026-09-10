import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "approve" | "reject";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

const variantStyles: Record<string, string> = {
  approve: "bg-emerald-600 hover:bg-emerald-700 text-white",
  reject: "bg-rose-600 hover:bg-rose-700 text-white",
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "approve",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-medium ${variantStyles[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}