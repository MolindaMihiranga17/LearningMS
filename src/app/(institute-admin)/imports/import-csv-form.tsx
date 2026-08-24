"use client";

import * as React from "react";
import { bulkImportRecords } from "@/lib/actions/bulk-import.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type ImportTemplate = { label: string; value: string; sample: string };

function getPreview(csv: string) {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    headers: lines[0]?.split(",").map((header) => header.trim()).filter(Boolean) ?? [],
    rowCount: Math.max(0, lines.length - 1),
    rows: lines.slice(1, 4),
  };
}

export function ImportCsvForm({ templates }: { templates: ImportTemplate[] }) {
  const [type, setType] = React.useState(templates[0]?.value ?? "students");
  const [csv, setCsv] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [error, setError] = React.useState("");
  const preview = getPreview(csv);
  const selectedTemplate = templates.find((template) => template.value === type) ?? templates[0];

  return (
    <form
      action={bulkImportRecords}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        if (!confirmed) {
          event.preventDefault();
          setError("Confirm that you reviewed the preview before importing.");
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium" htmlFor="import-type">Import type</label>
          <select
            id="import-type"
            name="type"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setConfirmed(false);
            }}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
          >
            {templates.map((template) => (
              <option key={template.value} value={template.value}>{template.label}</option>
            ))}
          </select>
          <label className="text-sm font-medium" htmlFor="import-csv">CSV data</label>
          <Textarea
            id="import-csv"
            name="csv"
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              setConfirmed(false);
              setError("");
            }}
            className="min-h-56 font-mono text-xs"
            placeholder={selectedTemplate?.sample}
            required
          />
        </div>

        <aside className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <p className="text-sm font-semibold">Import preview</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Review the detected structure before records are created. Existing or invalid records are skipped.
          </p>
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Data rows</dt><dd className="font-medium">{preview.rowCount}</dd>
            <dt className="text-muted-foreground">Columns</dt><dd className="font-medium">{preview.headers.length}</dd>
          </dl>
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="text-xs font-medium text-muted-foreground">Detected headers</p>
            <p className="mt-1 break-words text-xs">{preview.headers.join(", ") || "Paste CSV data to preview."}</p>
          </div>
          {preview.rows.length > 0 ? (
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="text-xs font-medium text-muted-foreground">First rows</p>
              <div className="mt-2 flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
                {preview.rows.map((row, index) => <p key={index} className="truncate">{row}</p>)}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
        <Checkbox name="confirmed" value="true" checked={confirmed} onCheckedChange={(value) => setConfirmed(Boolean(value))} />
        <span>I reviewed the preview and understand that this creates new records. Duplicate or invalid rows will be skipped.</span>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="self-start" disabled={!confirmed || preview.rowCount === 0}>Run import</Button>
    </form>
  );
}
