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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { MoreVertical, Check, ChevronsUpDown, CheckCircle2 } from "lucide-react";
import RequestTableSkeleton from "./RequestTableSkeleton";
import { useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api";


/* ================= TYPES ================= */
type Role = {
  id: number;
  name: string;
};

type Application = {
  id: number;
  name: string;
};

type Approval = {
  id: number;
  level: number;
  approver_id: string;
  approver_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Request = {
  id: number;
  request_code: string;
  type: "application_access" | "change_role";
  status: "pending" | "approved" | "rejected";

  justification: string | null;

  created_at: string;

  application: Application;

  old_role: Role | null;
  new_role: Role | null;

  approvals: Approval[];
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

  const [openDetail, setOpenDetail] = React.useState(false);
  const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<Request | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);


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

  const openDetailModal = async (code: string) => {
    try {
      setOpenDetail(true);
      setDetailLoading(true);
      setDetail(null);

      const res = await apiFetch(`/requests/${code}`);

      setDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };




  /* ================= COLUMNS ================= */
  const columns: ColumnDef<Request, any>[] = [
    {
      accessorKey: "request_code",
      header: "Request Code",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "application.name", // ⬅️ ini trick penting
      id: "application",               // ⬅️ tetap kasih id
      header: "Application",
      cell: ({ row }) => row.original.application?.name ?? "-",
      filterFn: "includesString",
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
        const { type, old_role, new_role } = row.original;

        // Application access → cuma new role
        if (type === "application_access") {
          return new_role?.name ?? "-";
        }

        // Change role → old → new
        return (
          <div className="text-sm">
            <div>
              {old_role?.name ?? "-"} → {new_role?.name ?? "-"}
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
            value={
              (table.getColumn("application")?.getFilterValue() ?? "") as string
            }
            onChange={(e) =>
              table.getColumn("application")?.setFilterValue(e.target.value)
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
                  <TableRow
                    key={row.id}
                    onClick={() => openDetailModal(row.original.request_code)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
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

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              Request Detail
            </DialogTitle>
            <DialogDescription>
              {detail?.request_code}
            </DialogDescription>
          </DialogHeader>

          {/* LOADING */}
          {detailLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {/* CONTENT */}
          {!detailLoading && detail && (
            <div className="space-y-4 text-sm">

              {/* BASIC INFO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Application</p>
                  <p className="font-medium">
                    {detail.application.name}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="capitalize">
                    {detail.type.replace("_", " ")}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">
                    {detail.status}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>
                    {new Date(detail.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ROLE */}
              <div>
                <p className="text-muted-foreground mb-1">Role</p>

                {detail.type === "application_access" ? (
                  <p>{detail.new_role?.name}</p>
                ) : (
                  <p>
                    {detail.old_role?.name} → {detail.new_role?.name}
                  </p>
                )}
              </div>

              {/* JUSTIFICATION */}
              <div>
                <p className="text-muted-foreground mb-1">Justification</p>
                <p className="bg-muted p-3 rounded">
                  {detail.justification || "-"}
                </p>
              </div>

              {/* APPROVALS */}
              <div>
                <p className="text-muted-foreground mb-2">Approvals</p>

                <div className="space-y-2">
                  {detail.approvals.map(a => (
                    <div
                      key={a.id}
                      className="flex justify-between border rounded p-2"
                    >
                      <span>
                        Level {a.level} ( {a.approver_id} ) {a.approver_name}
                      </span>

                      <span
                        className={`capitalize font-medium ${a.status === "approved"
                            ? "text-success"
                            : a.status === "rejected"
                              ? "text-danger"
                              : "text-warning"
                          }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>


    </>
  );


}
