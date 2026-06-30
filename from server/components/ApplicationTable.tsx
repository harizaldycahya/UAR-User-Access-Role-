'use client';

import * as React from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ChevronsUpDown,
  Eye,
} from "lucide-react";

import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

import RequestTableSkeleton from "./RequestTableSkeleton";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */
interface Application {
  id: number;
  owner: string;
  code: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

/* ================= COMPONENT ================= */
export default function ApplicationTable() {
  const [data, setData] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const router = useRouter();

  /* ================= FETCH ================= */
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/applications");
        setData(res.data);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ================= HANDLERS ================= */
  const handleOpenDetail = (code: string) => {
    // Navigate to detail page
    router.push(`/applications/${code}`);
    // Or if using Next.js router:
    // router.push(`/applications/${id}`);
  };

  /* ================= COLUMNS ================= */
  const columns: ColumnDef<Application>[] = [
    { header: "Code", accessorKey: "code" },
    {
      header: "Application",
      accessorKey: "name",
      cell: ({ row, getValue }) => {
        const app = row.original;
        return (
          <button
            onClick={() => handleOpenDetail(app.code)}
            className="text-primary underline underline-offset-2 hover:opacity-80 text-left"
          >
            {getValue<string>()}
          </button>
        );
      },
    },
    {
      header: "URL",
      accessorKey: "url",
      cell: ({ getValue }) => {
        const url = getValue<string>();
        if (!url) return <span className="text-muted-foreground">-</span>;
        const safe = url.startsWith("http") ? url : `https://${url}`;
        return (
          <a
            href={safe}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {url}
          </a>
        );
      },
    },
    { header: "Owner", accessorKey: "owner" },
    {
      header: "Icon",
      accessorKey: "icon",
      cell: ({ getValue }) => {
        const name = getValue() as keyof typeof Icons;
        const Icon = Icons[name] as LucideIcon | undefined;
        return Icon ? <Icon className="h-5 w-5" /> : "-";
      },
    },
    {
      header: "Color",
      accessorKey: "color",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: getValue<string>() }}
          />
          <span className="text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        </div>
      ),
    },
  ];


  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, sorting },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <RequestTableSkeleton />;

  return (
    <>
      {/* TABLE */}
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-lg">Application List</CardTitle>
            <CardDescription>Application List</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableHead
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}

                        {h.column.getIsSorted() === "asc" && (
                          <span>▲</span>
                        )}
                        {h.column.getIsSorted() === "desc" && (
                          <span>▼</span>
                        )}
                        {!h.column.getIsSorted() && (
                          <ChevronsUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>

                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {/* PAGINATION */}
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </CardFooter>
      </Card>
    </>
  );
}