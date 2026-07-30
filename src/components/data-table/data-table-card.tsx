"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn = {
  key: string;
  header: string;
  headerClassName?: string;
};

export type DataTableRow = {
  key: string;
  /** Plain-text value to match against the search query; omit for non-searchable tables. */
  searchValue?: string;
  cells: React.ReactNode[];
};

export function DataTableCard({
  columns,
  rows,
  searchPlaceholder = "Search...",
  emptyTitle = "No results yet.",
  emptyDescription,
  pageSize = 10,
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const searchable = rows.some((row) => row.searchValue !== undefined);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => (row.searchValue ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  React.useEffect(() => {
    setPage(1);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Card>
      {searchable ? (
        <CardHeader className="border-b border-border/60 pb-(--card-spacing)">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="whitespace-normal">
                  <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {query ? `No results for "${query}"` : emptyTitle}
                    </p>
                    {!query && emptyDescription ? (
                      <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.key}>
                  {row.cells.map((cell, index) => (
                    <TableCell key={index}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {filtered.length > pageSize ? (
        <CardFooter>
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
}
