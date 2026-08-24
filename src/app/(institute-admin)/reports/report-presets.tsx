"use client";

import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { saveReportPreset, deleteReportPreset } from "@/lib/actions/admin-preferences.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

const REPORTS = [{ value: "students", label: "Student records" }, { value: "fees", label: "Fee schedule" }, { value: "terms", label: "Academic terms" }, { value: "calendar", label: "Academic calendar" }] as const;
const FORMATS = [{ value: "csv", label: "CSV" }, { value: "xlsx", label: "Excel" }, { value: "pdf", label: "PDF" }] as const;
type Preset = { id: string; name: string; reportTypes: string[]; formats: string[]; createdAt: string };
function exportType(type: string) { return type === "calendar" ? "calendar-events" : type; }
export function ReportPresets({ presets }: { presets: Preset[] }) {
  const [name, setName] = useState(""); const [reportTypes, setReportTypes] = useState<string[]>(["students"]); const [formats, setFormats] = useState<string[]>(["csv"]); const [pending, startTransition] = useTransition();
  const toggle = (value: string, values: string[], setValues: (next: string[]) => void) => setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const save = () => startTransition(async () => { const result = await saveReportPreset({ name, reportTypes, formats }); if (result.error) toast.error("Could not save preset", result.error); else { toast.success("Report preset saved"); setName(""); } });
  const remove = (presetId: string) => startTransition(async () => { const result = await deleteReportPreset({ presetId }); if (result.error) toast.error("Could not delete preset", result.error); else toast.success("Report preset deleted"); });
  return <div className="flex flex-col gap-5"><div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]"><div><Label htmlFor="preset-name">Preset name</Label><Input id="preset-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Monthly operations" maxLength={80} /></div><div><p className="text-sm font-medium">Reports</p><div className="mt-2 flex gap-3">{REPORTS.map((item) => <Label key={item.value} className="flex items-center gap-1.5 text-sm font-normal"><Checkbox checked={reportTypes.includes(item.value)} onCheckedChange={() => toggle(item.value, reportTypes, setReportTypes)} />{item.label}</Label>)}</div></div><div><p className="text-sm font-medium">Formats</p><div className="mt-2 flex gap-3">{FORMATS.map((item) => <Label key={item.value} className="flex items-center gap-1.5 text-sm font-normal"><Checkbox checked={formats.includes(item.value)} onCheckedChange={() => toggle(item.value, formats, setFormats)} />{item.label}</Label>)}</div></div><Button type="button" onClick={save} disabled={pending} className="self-end">Save preset</Button></div>
  {presets.length === 0 ? <p className="text-sm text-muted-foreground">No saved presets yet.</p> : <div className="grid gap-3 md:grid-cols-2">{presets.map((preset) => <div key={preset.id} className="rounded-xl border border-border/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{preset.name}</p><p className="mt-1 text-xs text-muted-foreground">{preset.reportTypes.join(", ")} · {preset.formats.join(", ").toUpperCase()}</p></div><Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(preset.id)} disabled={pending} aria-label={`Delete ${preset.name}`}><Trash2 className="size-4" /></Button></div><div className="mt-3 flex flex-wrap gap-2">{preset.reportTypes.flatMap((type) => preset.formats.map((format) => <a key={`${type}-${format}`} href={`/api/reports/export/${exportType(type)}?format=${format}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-success"><Download className="size-3" />{type} {format.toUpperCase()}</a>))}</div></div>)}</div>}</div>;
}
