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

import { MoreVertical, Check, ChevronsUpDown, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import RequestTableSkeleton from "./RequestTableSkeleton";
import { useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { defineStepper } from "@stepperize/react";

/* ================= TYPES ================= */
type Approval = {
  id: number;
  level: number;
  approver_id: string;
  approver_name: string;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  created_at: string;
};

type Application = {
  id: number;
  name: string;
  role_mode: "static" | "dynamic";
};

type Request = {
  id: number;
  request_code: string;
  type: "application_access" | "change_role";
  status: "pending" | "approved" | "rejected";
  justification: string | null;
  notes: string | null;
  created_at: string;
  application: Application;
  old_role_id: string | null;
  old_role_name: string | null;
  new_role_id: string | null;
  new_role_name: string | null;
  approvals: Approval[];
};

/* ================= APPROVAL STEPPER COMPONENT ================= */
const ApprovalStepper = ({ approvals }: { approvals: Approval[] }) => {
  const { Stepper } = React.useMemo(
    () => defineStepper(...approvals.map((a) => ({
      id: `level-${a.level}`,
      title: a.approver_name,
    }))),
    [approvals]
  );

  return (
    <Stepper.Root orientation="horizontal" className="w-full">
      {() => (
        <Stepper.List className="flex list-none items-center w-full">
          {approvals.map((a, index) => {
            const isApproved = a.status === "approved";
            const isRejected = a.status === "rejected";
            const isLast = index === approvals.length - 1;

            return (
              <React.Fragment key={a.id}>
                <Stepper.Item
                  step={`level-${a.level}`}
                  className="flex flex-col items-center flex-shrink-0"
                >
                  <Stepper.Trigger
                    render={(domProps) => (
                      <button
                        {...domProps}
                        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all cursor-default
                          ${isApproved
                            ? "bg-success text-white"
                            : isRejected
                              ? "bg-destructive text-white"
                              : "bg-background border-border text-muted-foreground"
                          }`}
                      >
                        {isApproved
                          ? <Check className="w-5 h-5" />
                          : isRejected
                            ? <X className="w-5 h-5" />
                            : <Clock className="w-4 h-4" />
                        }
                      </button>
                    )}
                  />
                  <div className="text-center mt-2 max-w-40">
                    <Stepper.Title
                      render={(domProps) => (
                        <p {...domProps} className="font-semibold leading-tight truncate">
                          {a.approver_name}
                        </p>
                      )}
                    />
                    <p className=" text-xs text-muted-foreground mt-0.5">Level {a.level}</p>
                    <p className={` text-xs font-bold capitalize mt-0.5
                      ${isApproved
                        ? "text-success"
                        : isRejected
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}>
                      {a.status}
                    </p>
                  </div>
                </Stepper.Item>

                {!isLast && (
                  <Stepper.Separator
                    orientation="horizontal"
                    data-status={isApproved ? "success" : "inactive"}
                    className="flex-1 self-start mt-5 h-1 bg-border data-[status=success]:bg-success transition-colors mx-1"
                  />
                )}
              </React.Fragment>
            );
          })}
        </Stepper.List>
      )}
    </Stepper.Root>
  );
};

/* ================= MAIN COMPONENT ================= */
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
  const [detail, setDetail] = React.useState<Request | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

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
    { accessorKey: "request_code", header: "Request Code" },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: "application.name",
      id: "application",
      header: "Application",
      cell: ({ row }) => row.original.application?.name ?? "-",
      filterFn: "includesString",
    },
    {
      accessorKey: "type",
      header: "Request Type",
      cell: ({ row }) =>
        row.original.type === "application_access" ? "Application Access" : "Role Change",
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => {
        const status = row.original.status;
        const styles = {
          approved: "bg-success/10 text-success border-success/30",
          rejected: "bg-destructive/10 text-destructive border-destructive/30",
          pending: "bg-warning/10 text-warning border-warning/30",
        };
        return (
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles[status]}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: "role",
      header: ({ table }) => {
        const rows = table.getRowModel().rows;
        return rows[0]?.original.application?.role_mode === "dynamic" ? "Notes" : "Role";
      },
      cell: ({ row }) => {
        const { type, old_role_name, new_role_name, notes, application } = row.original;
        if (application?.role_mode === "dynamic") {
          return (
            <span className="text-muted-foreground italic truncate block max-w-96" title={notes ?? "-"}>
              {notes ?? "-"}
            </span>
          );
        }
        if (type === "application_access") return new_role_name ?? "-";
        return <div className="text-sm">{old_role_name ?? "-"} → {new_role_name ?? "-"}</div>;
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
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Requests", count: totalRequests, color: "", filter: undefined },
          { label: "On Going Requests", count: pendingCount, color: "text-warning", filter: "pending" as const },
          { label: "Approved Requests", count: approvedCount, color: "text-success", filter: "approved" as const },
          { label: "Rejected Requests", count: rejectedCount, color: "text-destructive", filter: "rejected" as const },
        ].map(({ label, count, color, filter }) => (
          <Card
            key={label}
            onClick={() => filterByStatus(filter)}
            className="cursor-pointer border-border/40 hover:border-border transition-colors"
          >
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <h3 className={`text-2xl font-bold ${color}`}>{count}</h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span>{count} Request</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABLE CARD */}
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

        <CardContent className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Search application..."
            value={(table.getColumn("application")?.getFilterValue() ?? "") as string}
            onChange={(e) => table.getColumn("application")?.setFilterValue(e.target.value)}
            className="h-9 w-60 text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-60 text-sm capitalize text-left">
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
                  {table.getColumn("status")?.getFilterValue() === status && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue(undefined)}>
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-225">
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id}>
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="cursor-pointer select-none" onClick={() => table.getColumn(h.id)?.toggleSorting()}>
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

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </CardFooter>
      </Card>

      {/* DETAIL DIALOG */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent style={{ maxWidth: "72rem" }} className="w-full">

          <DialogHeader>
            <DialogTitle>Request Detail</DialogTitle>
            <DialogDescription>{detail?.request_code}</DialogDescription>
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

              {/* CARD: APPROVAL STEPPER */}
              <Card>
                <CardContent className="pt-5">
                  <ApprovalStepper approvals={detail.approvals} />
                </CardContent>
              </Card>

              {/* CARD: INFO */}
              <Card>
                <CardContent className="pt-5 space-y-4">

                  {/* BASIC INFO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Application</p>
                      <p className="font-medium bg-muted p-3 rounded">
                        {detail.application.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="capitalize bg-muted p-3 rounded">
                        {detail.type.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className={`font-medium capitalize bg-muted p-3 rounded
                        ${detail.status === "approved"
                          ? "text-success"
                          : detail.status === "rejected"
                            ? "text-destructive"
                            : "text-warning"
                        }`}>
                        {detail.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="bg-muted p-3 rounded">
                        {new Date(detail.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* ROLE / NOTES */}
                  <div>
                    <p className="text-muted-foreground mb-1">
                      {detail.application?.role_mode === "dynamic" ? "Notes" : "Role"}
                    </p>
                    {detail.application?.role_mode === "dynamic" ? (
                      <p className="bg-muted p-3 rounded">{detail.notes ?? "-"}</p>
                    ) : detail.type === "application_access" ? (
                      <p className="bg-muted p-3 rounded">{detail.new_role_name ?? "-"}</p>
                    ) : (
                      <p className="bg-muted p-3 rounded">{detail.old_role_name ?? "-"} → {detail.new_role_name ?? "-"}</p>
                    )}
                  </div>

                  {/* JUSTIFICATION */}
                  <div>
                    <p className="text-muted-foreground mb-1">Justification</p>
                    <p className="bg-muted p-3 rounded">
                      {detail.justification || "-"}
                    </p>
                  </div>

                  {/* REJECT REASON — tampil hanya jika ada approval yang rejected */}
                  {detail.approvals.some(a => a.status === "rejected" && a.reason) && (
                    <div>
                      <p className="text-muted-foreground mb-1">Reject Reason</p>
                      {detail.approvals
                        .filter(a => a.status === "rejected" && a.reason)
                        .map(a => (
                          <div key={a.id} className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded">
                            <p className="text-xs font-medium mb-0.5">Level {a.level} — {a.approver_name}</p>
                            <p>{a.reason}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}

                </CardContent>
              </Card>

            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}