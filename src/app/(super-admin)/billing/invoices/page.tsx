import Link from "next/link";
import { listInvoices } from "@/lib/data/subscription.data";
import { listInstitutes } from "@/lib/data/institute.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Badge } from "@/components/ui/badge";
import { InvoiceFormDialog } from "./new/invoice-form-dialog";

const columns = [{ key: "invoice", header: "Invoice" }, { key: "institute", header: "Institute", sortable: true }, { key: "amount", header: "Amount", sortable: true }, { key: "due", header: "Due", sortable: true }, { key: "status", header: "Status", sortable: true }];
export default async function InvoicesPage() {
  const [invoices, institutesList] = await Promise.all([listInvoices(), listInstitutes()]);
  const institutes = institutesList.map((institute) => ({ id: String(institute._id), name: institute.name, code: institute.code }));
  const rows: DataTableRow[] = invoices.map((invoice) => { const institute = invoice.instituteId as unknown as { name?: string } | null; const status = invoice.status === "pending" && invoice.dueAt < new Date() ? "overdue" : invoice.status; return { key: String(invoice._id), searchValue: `${invoice.invoiceNumber} ${institute?.name ?? ""} ${status}`, sortValues: [null, institute?.name ?? "", invoice.amount, invoice.dueAt.getTime(), status], cells: [<Link key="invoice" href={`/billing/invoices/${invoice._id}`} className="font-medium hover:underline">{invoice.invoiceNumber}</Link>, institute?.name ?? "Unknown institute", `${invoice.currency} ${invoice.amount.toFixed(2)}`, new Date(invoice.dueAt).toLocaleDateString(), <Badge key="status" variant={status === "paid" ? "success" : status === "overdue" ? "destructive" : "secondary"} className="capitalize">{status}</Badge>] }; });
  return <div><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Invoices</h1><p className="mt-1 text-sm text-muted-foreground">Manual subscription billing records.</p></div><div className="flex items-center gap-4"><a href="/api/platform-reports/invoices?format=csv" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Export CSV</a><a href="/api/platform-reports/invoices?format=pdf" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Export PDF</a><InvoiceFormDialog institutes={institutes} /></div></div><div className="mt-6"><DataTableCard columns={columns} rows={rows} searchPlaceholder="Search invoices..." emptyTitle="No invoices yet." /></div></div>;
}
