"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox, Search, SearchX } from "lucide-react";
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
  /** Enables click-to-sort on this column; requires rows to provide a matching `sortValues` entry. */
  sortable?: boolean;
};

export type DataTableRow = {
  key: string;
  /** Plain-text value to match against the search query; omit for non-searchable tables. */
  searchValue?: string;
  /** Comparable values parallel to `cells`, used only for sortable columns. */
  sortValues?: (string | number | null | undefined)[];
  cells: React.ReactNode[];
};

type SortState = { index: number; direction: "asc" | "desc" };

function EmptyState({ title, description }: { title: string; description?: string }) {
  const Icon = description ? Inbox : SearchX;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4.5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

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
  const [sort, setSort] = React.useState<SortState | null>(null);

  const searchable = !compact && rows.some((row) => row.searchValue !== undefined);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => (row.searchValue ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const { index, direction } = sort;
    const factor = direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a.sortValues?.[index];
      const bv = b.sortValues?.[index];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [filtered, sort]);

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function toggleSort(index: number) {
    setSort((current) => {
      if (!current || current.index !== index) return { index, direction: "asc" };
      if (current.direction === "asc") return { index, direction: "desc" };
      return null;
    });
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

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
                onChange={(event) => handleSearchChange(event.target.value)}
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
                {columns.map((column, index) => {
                  const isSorted = sort?.index === index;
                  const Icon = isSorted
                    ? sort?.direction === "asc"
                      ? ChevronUp
                      : ChevronDown
                    : ChevronsUpDown;

                  return (
                    <TableHead
                      key={column.key}
                      className={cn(cellPadding, column.headerClassName)}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(index)}
                          className={cn(
                            "flex items-center gap-1 text-left transition-colors hover:text-foreground",
                            isSorted && "text-foreground"
                          )}
                        >
                          {column.header}
                          <Icon className={cn("size-3.5", !isSorted && "text-muted-foreground/50")} />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="whitespace-normal">
                    <EmptyState
                      title={query ? `No results for "${query}"` : emptyTitle}
                      description={!query ? emptyDescription : undefined}
                    />
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
              <EmptyState
                title={query ? `No results for "${query}"` : emptyTitle}
                description={!query ? emptyDescription : undefined}
              />
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

      {sorted.length > pageSize ? (
        <CardFooter>
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
}
