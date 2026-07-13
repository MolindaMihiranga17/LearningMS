import Link from "next/link";
import { listInstitutes } from "@/lib/data/institute.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InstitutesPage() {
  const institutes = await listInstitutes();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Institutes</h1>
        <Link href="/institutes/new" className={cn(buttonVariants())}>
          New institute
        </Link>
      </div>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No institutes yet.
                </TableCell>
              </TableRow>
            ) : (
              institutes.map((institute) => (
                <TableRow key={String(institute._id)}>
                  <TableCell>
                    <Link
                      href={`/institutes/${institute._id}`}
                      className="font-medium hover:underline"
                    >
                      {institute.name}
                    </Link>
                  </TableCell>
                  <TableCell>{institute.code}</TableCell>
                  <TableCell className="capitalize">{institute.status}</TableCell>
                  <TableCell>
                    {institute.createdAt
                      ? new Date(institute.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
