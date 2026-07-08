import Link from "next/link";
import { listClasses } from "@/lib/data/class.data";
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

export default async function ClassesPage() {
  const classes = await listClasses();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <Link href="/classes/new" className={cn(buttonVariants())}>
          New class
        </Link>
      </div>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Academic year</TableHead>
              <TableHead>Class teacher</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No classes yet.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((klass) => (
                <TableRow key={String(klass._id)}>
                  <TableCell className="font-medium">{klass.name}</TableCell>
                  <TableCell>{klass.section || "-"}</TableCell>
                  <TableCell>{klass.academicYear}</TableCell>
                  <TableCell>
                    {(klass.classTeacherId as unknown as { name?: string } | null)?.name || "-"}
                  </TableCell>
                  <TableCell className="capitalize">{klass.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
