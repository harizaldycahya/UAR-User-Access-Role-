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
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";




/* ================= TYPES ================= */
type Request = {
  id: number; // request id

  approval_id: number;
  level: number;
  approval_status: "pending" | "approved" | "rejected";

  type: "application_access" | "change_role";

  application_name: string;

  old_role_name: string | null;
  new_role_name: string | null;

  justification: string | null;
  created_at: string;
};

interface ApprovalItem {
  approval_status: "pending" | "approved" | "rejected";
}


const StatusBadge = ({ status }: { status: "pending" | "approved" | "rejected" }) => {
  const styles = {
    pending: "bg-warning/10 text-warning border-warning/30",
    approved: "bg-success/10 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border px-3 py-1
        text-xs font-medium capitalize
        ${styles[status]}
      `}
    >
      {status}
    </span>
  );
};


/* ================= COMPONENT ================= */
export default function ApprovalTable() {
  const [data, setData] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [summary, setSummary] = React.useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [statusFilter, setStatusFilter] = React.useState<"pending" | "approved" | "rejected" | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status"); // Pending | Approved | Rejected

  const pageTitleMap: Record<string, string> = {
    pending: "Pending Approvals",
    approved: "Approval History (Approved)",
    rejected: "Approval History (Rejected)",
    history: "Approval History",
  };

  const statusLabel = React.useMemo(() => {
    if (!statusParam) return "Filter Status";

    switch (statusParam) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "history":
        return "All History";
      default:
        return "Filter Status";
    }
  }, [statusParam]);



  const pageTitle = pageTitleMap[statusParam ?? ""] ?? "All Approvals";

  /* ================= FETCH DATA ================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const endpoint =
        statusParam === "pending" || !statusParam
          ? "/requests/approvals/me"
          : "/requests/approvals/me/history";

      const res = await apiFetch(endpoint);

      if (!res || res.success === false) {
        throw new Error(res?.message || "Unknown API error");
      }

      setData(res.data);
    } catch (err: any) {
      console.error("LOAD DATA ERROR:", err);

      Swal.fire({
        icon: "error",
        title: "Failed to load data",
        text:
          err?.message ||
          err?.response?.data?.message ||
          JSON.stringify(err),
      });

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [statusParam]);

  React.useEffect(() => {
    loadSummary();
  }, []);


  const loadSummary = async () => {
    try {
      const pendingRes = await apiFetch("/requests/approvals/me"); // pending
      const historyRes = await apiFetch("/requests/approvals/me/history"); // approved + rejected

      const pending = pendingRes.data.length;
      const approved = historyRes.data.filter(
        (i: ApprovalItem) => i.approval_status === "approved"
      ).length;

      const rejected = historyRes.data.filter(
        (i: ApprovalItem) => i.approval_status === "rejected"
      ).length;

      setSummary({
        total: pending + approved + rejected,
        pending,
        approved,
        rejected,
      });
    } catch (err) {
      console.error("LOAD SUMMARY ERROR:", err);
    }
  };

  const filterByStatus = (
    status?: "pending" | "approved" | "rejected" | "history"
  ) => {
    if (!status) {
      router.replace("/approvals");
      return;
    }

    router.replace(`/approvals?status=${status}`);
  };


  const submitApproval = async (
    approvalId: number,
    action: "approve" | "reject"
  ) => {
    try {
      const res = await apiFetch("/requests/approvals/action", {
        method: "POST",
        body: JSON.stringify({
          approval_id: approvalId,
          action,
        }),
      });

      if (!res || res.success === false) {
        throw new Error(res?.message || "Approval API failed");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: action === "approve"
          ? "Request approved"
          : "Request rejected",
      });

      await loadData();
    } catch (err: any) {
      console.error("APPROVAL ERROR:", err);

      Swal.fire({
        icon: "error",
        title: "Approval Failed",
        text:
          err?.message ||
          err?.response?.data?.message ||
          JSON.stringify(err),
      });
    }
  };

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
      accessorKey: "approval_status",
      header: "Status",
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);

        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }

        return value === filterValue;
      },
      cell: ({ row }) => (
        <StatusBadge status={row.original.approval_status} />
      ),
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
            <div>
              {old_role_name ?? "-"} → {new_role_name ?? "-"}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const { approval_status, approval_id } = row.original;

        if (approval_status !== "pending") {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submitApproval(approval_id, "approve")}
            >
              Approve
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => submitApproval(approval_id, "reject")}
            >
              Reject
            </Button>
          </div>
        );
      },
    }

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


  if (loading) return <RequestTableSkeleton />;

  return (

    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Total Requests
            </p>
            <h3 className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : summary.total}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : summary.total} Request
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
              {loading ? <Skeleton className="h-8 w-16" /> : summary.pending}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : summary.pending} Request
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
              {loading ? <Skeleton className="h-8 w-16" /> : summary.approved}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : summary.approved} Request
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
              {loading ? <Skeleton className="h-8 w-16" /> : summary.rejected}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {loading ? '...' : summary.rejected} Request
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-lg">{pageTitle}</CardTitle>
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
          {statusParam !== "pending" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-60 text-sm capitalize text-left">
                  {statusLabel}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => filterByStatus("history")}>
                  All History
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => filterByStatus("approved")}>
                  Approved
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => filterByStatus("rejected")}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
