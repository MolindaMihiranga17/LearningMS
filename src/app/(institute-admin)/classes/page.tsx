import Link from "next/link";
import { listClasses } from "@/lib/data/class.data";
import { deleteClass } from "@/lib/actions/class.actions";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <div>
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/classes/${klass._id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                      <form action={deleteClass}>
                        <input type="hidden" name="id" value={String(klass._id)} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
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
