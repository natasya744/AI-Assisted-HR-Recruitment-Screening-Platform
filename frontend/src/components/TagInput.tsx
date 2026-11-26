import { useState, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react";
import { X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  id?: string;
  label?: string;
  helperText?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  badgeTone?: "indigo" | "slate";
}

export default function TagInput({
  id,
  label,
  helperText,
  items = [],
  onChange,
  placeholder = "Type and press Enter or comma...",
  badgeTone = "indigo",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function addItems(rawText: string) {
    if (!rawText.trim()) return;
    const splitParts = rawText
      .split(/[,;\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (splitParts.length === 0) return;

    const existingLower = new Set(items.map((item) => item.toLowerCase()));
    const newItems = [...items];

    for (const part of splitParts) {
      if (!existingLower.has(part.toLowerCase())) {
        existingLower.add(part.toLowerCase());
        newItems.push(part);
      }
    }

    onChange(newItems);
    setInputValue("");
  }

  function removeItem(indexToRemove: number) {
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (inputValue.trim()) {
        e.preventDefault();
        addItems(inputValue);
      } else if (e.key === ",") {
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && !inputValue && items.length > 0) {
      e.preventDefault();
      removeItem(items.length - 1);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.includes(",") || val.includes(";")) {
      addItems(val);
    } else {
      setInputValue(val);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (pasted && (pasted.includes(",") || pasted.includes(";") || pasted.includes("\n"))) {
      e.preventDefault();
      addItems(pasted);
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addItems(inputValue);
    }
  }

  const badgeStyles =
    badgeTone === "indigo"
      ? "bg-neutral-900 border-neutral-900 text-white"
      : "bg-neutral-100 border-neutral-200 text-neutral-800";

  const removeButtonStyles =
    badgeTone === "indigo"
      ? "text-neutral-300 hover:bg-white/15 hover:text-white"
      : "text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900";

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            {label} ({items.length})
          </Label>
          {helperText && <span className="text-[11px] text-neutral-400">{helperText}</span>}
        </div>
      )}

      <div
        className="min-h-[44px] w-full rounded-lg border border-neutral-200 bg-white p-1.5 shadow-2xs transition-colors focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/10 flex flex-wrap items-center gap-1.5"
        onClick={() => {
          if (id) {
            document.getElementById(id)?.focus();
          }
        }}
      >
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
              badgeStyles
            )}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(idx);
              }}
              className={cn("rounded p-0.5 focus:outline-none cursor-pointer", removeButtonStyles)}
              title={`Remove ${item}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[140px] flex items-center">
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={items.length === 0 ? placeholder : "Add more..."}
            className="w-full bg-transparent px-2 py-1 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addItems(inputValue)}
              className="mr-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-200 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="size-3" /> Add
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-neutral-400">
        Type and press <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1 py-0.5 text-[10px] font-mono text-neutral-600">Enter</kbd> or <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1 py-0.5 text-[10px] font-mono text-neutral-600">,</kbd> (comma) to add. Paste lists to add multiple at once.
      </p>
    </div>
  );
}
