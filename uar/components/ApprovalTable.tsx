'use client';

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Check, ChevronsUpDown, CheckCircle2 } from "lucide-react";
import RequestTableSkeleton from "./RequestTableSkeleton";
import { useSearchParams } from "next/navigation";

/* ================= TYPES ================= */
type Request = {
  requestId: string;
  application: string;
  category: string;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
};

/* ================= COMPONENT ================= */
export default function ApprovalTable() {
  const [data, setData] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const totalRequests = data.length;
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status"); // Pending | Approved | Rejected

  /* ================= FETCH DATA ================= */
  React.useEffect(() => {
    let mounted = true;

    fetch("http://localhost:4000/requests")
      .then(res => res.json())
      .then((result: Request[]) => {
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= COLUMNS ================= */
  const columns: ColumnDef<Request, any>[] = [
    { id: "requestId", header: "Request ID", accessorFn: row => row.requestId },
    { id: "application", header: "Application", accessorFn: row => row.application },
    { id: "category", header: "Category", accessorFn: row => row.category },
    {
      id: "status",
      header: "Status",
      accessorFn: row => row.status,
      cell: ({ row }) => (
        <span className="rounded-md px-2 py-1 text-xs font-medium bg-card text-card-foreground">
          {row.getValue("status")}
        </span>
      ),
    },
    { id: "requestDate", header: "Request Date", accessorFn: row => row.requestDate },
  ];

  /* ================= TABLE ================= */
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

  /* ================= URL FILTER ================= */
  React.useEffect(() => {
    if (!statusParam) return;

    const normalized =
      statusParam.charAt(0).toUpperCase() + statusParam.slice(1);

    table.getColumn("status")?.setFilterValue(normalized);
  }, [statusParam]);


  if (loading) return <RequestTableSkeleton />;

  return (

    <>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Requests</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : totalRequests}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : totalRequests} Requested
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pending Approval</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : totalRequests}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : totalRequests} Requests
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Approved</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : totalRequests}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : totalRequests} Requested
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-lg">Approvals List</CardTitle>
            <CardDescription>Application access requests</CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => table.resetColumnFilters()}>
                Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* FILTERS */}
        <CardContent className="flex flex-wrap gap-4 mb-4">
          {columns.map(col => {
            const id = col.id;
            if (!id) return null;

            return id !== "status" ? (
              <Input
                key={id}
                placeholder={`Search ${col.header}`}
                value={(table.getColumn(id)?.getFilterValue() ?? "") as string}
                onChange={e => table.getColumn(id)?.setFilterValue(e.target.value)}
                className="h-9 w-60 text-sm"
              />
            ) : (
              <DropdownMenu key={id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-60 text-sm text-left">
                    {(table.getColumn(id)?.getFilterValue() as string) || "Filter Status"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {["Pending", "Approved", "Rejected"].map(status => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => table.getColumn(id)?.setFilterValue(status)}
                      className="flex justify-between"
                    >
                      {status}
                      {table.getColumn(id)?.getFilterValue() === status && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => table.getColumn(id)?.setFilterValue("")}>
                    Clear
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </CardContent>

        {/* TABLE */}
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-225">
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id}>
                    {hg.headers.map(h => (
                      <TableHead
                        key={h.id}
                        className="cursor-pointer select-none"
                        onClick={() => table.getColumn(h.id)?.toggleSorting()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
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
          </div>
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
