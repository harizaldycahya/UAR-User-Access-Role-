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

import { apiFetch } from "@/lib/api";


/* ================= TYPES ================= */
type Request = {
  id: number;
  type: "application_access" | "change_role";
  status: "pending" | "approved" | "rejected";

  application_name: string;

  old_role_name: string | null;
  new_role_name: string | null;

  justification: string | null;

  created_at: string;
};

/* ================= COMPONENT ================= */
export default function RequestTable() {
  const [data, setData] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const totalRequests = data.length;
  const pendingCount = data.filter(r => r.status === "pending").length;
  const approvedCount = data.filter(r => r.status === "approved").length;
  const rejectedCount = data.filter(r => r.status === "rejected").length;

  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status"); // Pending | Approved | Rejected

  /* ================= FETCH DATA ================= */
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/requests/me");
        setData(res.data);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  /* ================= COLUMNS ================= */
  const columns: ColumnDef<Request, any>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "application_name",
      header: "Application",
    },
    {
      accessorKey: "type",
      header: "Request Type",
      cell: ({ row }) =>
        row.original.type === "application_access"
          ? "Application Access"
          : "Role Change",
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => {
        const status = row.original.status;
        const color =
          status === "approved"
            ? "text-success"
            : status === "rejected"
              ? "text-danger"
              : "text-warning";
              
        return (
          <span className={`font-medium capitalize ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const { type, old_role_name, new_role_name } = row.original;

        if (type === "application_access") {
          return new_role_name ?? "-";
        }

        return (
          <div className="text-sm">
            <div className="text-muted-foreground">
              {old_role_name ?? "-"} → {new_role_name ?? "-"}
            </div>
          </div>
        );
      },
    },

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
    table.getColumn("status")?.setFilterValue(statusParam);
  }, [statusParam]);

  const filterByStatus = (status?: "pending" | "approved" | "rejected") => {
    table.getColumn("status")?.setFilterValue(status);
  };


  if (loading) return <RequestTableSkeleton />;

  return (

    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          onClick={() => filterByStatus(undefined)}
          className="cursor-pointer border-border/40 hover:border-border transition-colors"
        >
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Total Requests
            </p>
            <h3 className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : totalRequests}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : totalRequests} Request
              </span>
            </p>
          </CardContent>
        </Card>
        <Card
          onClick={() => filterByStatus("pending")}
          className="cursor-pointer border-border/40 hover:border-border transition-colors"
        >
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Pending Approval
            </p>
            <h3 className="text-2xl font-bold text-warning">
              {loading ? <Skeleton className="h-8 w-16" /> : pendingCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : pendingCount} Request
              </span>
            </p>
          </CardContent>
        </Card>
        <Card
          onClick={() => filterByStatus("approved")}
          className="cursor-pointer border-border/40 hover:border-border transition-colors"
        >
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Approved
            </p>
            <h3 className="text-2xl font-bold text-success">
              {loading ? <Skeleton className="h-8 w-16" /> : approvedCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : approvedCount} Request
              </span>
            </p>
          </CardContent>
        </Card>
        <Card
          onClick={() => filterByStatus("rejected")}
          className="cursor-pointer border-border/40 hover:border-border transition-colors"
        >
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Rejected
            </p>
            <h3 className="text-2xl font-bold text-destructive">
              {loading ? <Skeleton className="h-8 w-16" /> : rejectedCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : rejectedCount} Request
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-lg">My Requests</CardTitle>
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
          <Input
            placeholder="Search application..."
            value={(table.getColumn("application_name")?.getFilterValue() ?? "") as string}
            onChange={e =>
              table.getColumn("application_name")?.setFilterValue(e.target.value)
            }
            className="h-9 w-60 text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-60 text-sm capitalize text-left"
              >
                {(table.getColumn("status")?.getFilterValue() as string) || "Filter Status"}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {["pending", "approved", "rejected"].map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => table.getColumn("status")?.setFilterValue(status)}
                  className="flex justify-between capitalize"
                >
                  {status}
                  {table.getColumn("status")?.getFilterValue() === status && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem
                onClick={() => table.getColumn("status")?.setFilterValue(undefined)}
              >
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
