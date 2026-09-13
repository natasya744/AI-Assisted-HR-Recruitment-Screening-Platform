import { useState, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react";
import { X, Plus } from "lucide-react";

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
    // If the input ends with or contains a comma or semicolon, commit the tag
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
      ? "bg-indigo-50 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100/70"
      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70";

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {label} ({items.length})
          </label>
          {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}
        </div>
      )}

      <div
        className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 flex flex-wrap items-center gap-1.5"
        onClick={() => {
          if (id) {
            document.getElementById(id)?.focus();
          }
        }}
      >
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${badgeStyles}`}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(idx);
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-black/5 hover:text-slate-700 focus:outline-none"
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
            className="w-full bg-transparent px-2 py-1 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addItems(inputValue)}
              className="mr-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-0.5"
            >
              <Plus className="size-3" /> Add
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Type and press <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-slate-500">Enter</kbd> or <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-slate-500">,</kbd> (comma) to add. Paste lists to add multiple at once.
      </p>
    </div>
  );
}
