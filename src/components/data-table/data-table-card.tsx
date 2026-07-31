"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
  title,
  sub,
  columns,
  rows,
  searchPlaceholder = "Search...",
  emptyTitle = "No results yet.",
  emptyDescription,
  pageSize = 10,
  compact = false,
  stackOnMobile = true,
}: {
  title?: string;
  sub?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  compact?: boolean;
  stackOnMobile?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const searchable = !compact && rows.some((row) => row.searchValue !== undefined);

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

  const cellPadding = compact ? "px-3 py-2" : undefined;

  return (
    <Card size={compact ? "sm" : "default"}>
      {title || sub || searchable ? (
        <CardHeader className="gap-3 border-b border-border/60 pb-(--card-spacing)">
          {title || sub ? (
            <div>
              {title ? <div className="text-heading text-[15px] text-foreground">{title}</div> : null}
              {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
            </div>
          ) : null}
          {searchable ? (
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          ) : null}
        </CardHeader>
      ) : null}

      <CardContent className="px-0">
        <div className={cn(stackOnMobile && "hidden sm:block")}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(cellPadding, column.headerClassName)}
                  >
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
                      <TableCell key={index} className={cellPadding}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {stackOnMobile ? (
          <div className="flex flex-col gap-3 p-4 sm:hidden">
            {pageRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  {query ? `No results for "${query}"` : emptyTitle}
                </p>
                {!query && emptyDescription ? (
                  <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                ) : null}
              </div>
            ) : (
              pageRows.map((row) => {
                const middleCells = row.cells.slice(1, -1);
                const lastCell = row.cells.length > 1 ? row.cells[row.cells.length - 1] : null;

                return (
                  <div key={row.key} className="rounded-xl border border-border/60 p-3.5">
                    <div className="text-[13.5px] font-semibold text-foreground">
                      {row.cells[0]}
                    </div>
                    {middleCells.length > 0 ? (
                      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-2.5">
                        {middleCells.map((cell, index) => (
                          <div key={index} className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                              {columns[index + 1]?.header}
                            </span>
                            <span className="text-[13px] text-foreground">{cell}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {lastCell !== null ? (
                      <div className="mt-2.5 border-t border-border/60 pt-2.5">{lastCell}</div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
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
