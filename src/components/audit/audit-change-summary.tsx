"use client";

import { ChevronDown } from "lucide-react";

const SENSITIVE_FIELD = /password|hash|token|secret|authorization/i;

function safeValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null || value === "") return "—";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AuditChangeSummary({
  changedFields = [],
  before,
  after,
}: {
  changedFields?: string[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  const fields = (changedFields.length ? changedFields : [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])])
    .filter((field) => !SENSITIVE_FIELD.test(field));

  if (!fields.length) return <span className="text-xs text-muted-foreground">No field detail</span>;

  return (
    <details className="group min-w-36">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary hover:underline">
        {fields.length} field{fields.length === 1 ? "" : "s"} changed
        <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="mt-2 grid gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
        {fields.map((field) => (
          <div key={field} className="grid gap-1">
            <dt className="font-semibold text-foreground">{field}</dt>
            <dd className="break-all text-muted-foreground">
              <span className="line-through decoration-muted-foreground/60">{safeValue(before?.[field])}</span>
              <span className="mx-1.5 text-foreground">→</span>
              <span>{safeValue(after?.[field])}</span>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
