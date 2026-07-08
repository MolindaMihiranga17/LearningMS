import Link from "next/link";
import { listSubjects } from "@/lib/data/subject.data";
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

export default async function SubjectsPage() {
  const subjects = await listSubjects();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <Link href="/subjects/new" className={cn(buttonVariants())}>
          New subject
        </Link>
      </div>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Classes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No subjects yet.
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => {
                const teacher = subject.teacherId as unknown as { name?: string } | null;
                const classes = subject.classIds as unknown as
                  | { _id: string; name: string; section?: string }[]
                  | undefined;
                return (
                  <TableRow key={String(subject._id)}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{teacher?.name || "-"}</TableCell>
                    <TableCell>
                      {classes && classes.length > 0
                        ? classes
                            .map((klass) => `${klass.name}${klass.section ? ` ${klass.section}` : ""}`)
                            .join(", ")
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
