import { listInstitutes } from "@/lib/data/institute.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
  const institutes = await listInstitutes();
  return <div className="mx-auto w-full max-w-2xl"><Card><CardHeader><CardTitle>Create platform invoice</CardTitle></CardHeader><CardContent><InvoiceForm institutes={institutes.map((institute) => ({ id: String(institute._id), name: institute.name, code: institute.code }))} /></CardContent></Card></div>;
}
