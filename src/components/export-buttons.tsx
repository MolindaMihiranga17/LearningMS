import { Download, FileSpreadsheet, FileText } from "lucide-react";

export function ExportButtons({ endpoint }: { endpoint: string }) {
  const href = (format: "csv" | "xlsx" | "pdf") => `${endpoint}?format=${format}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={href("csv")} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 shadow-sm transition hover:-translate-y-px hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/35 dark:text-sky-300">
        <Download className="size-3.5" /> CSV
      </a>
      <a href={href("xlsx")} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-px hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-300">
        <FileSpreadsheet className="size-3.5" /> XLSX
      </a>
      <a href={href("pdf")} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 shadow-sm transition hover:-translate-y-px hover:bg-amber-100 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-300">
        <FileText className="size-3.5" /> PDF
      </a>
    </div>
  );
}
