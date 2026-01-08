'use client';

import * as React from "react";

import Swal from "sweetalert2";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  ChevronsUpDown,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";

import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

import RequestTableSkeleton from "./RequestTableSkeleton";
import { apiFetch } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const [data, setData] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [saving, setSaving] = React.useState(false);

  // EDIT
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openDetail, setOpenDetail] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<Application | null>(null);

  const [resultDialog, setResultDialog] = React.useState<{
    open: boolean;
    success: boolean;
    title: string;
    message: string;
  } | null>(null);

  const [form, setForm] = React.useState({
    owner: "",
    name: "",
    url: "",
    icon: "",
    color: "",
  });

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
  const handleOpenDetail = (app: Application) => {
    setSelectedApp(app);
    setOpenDetail(true);
  };

  const handleOpenEdit = (app: Application) => {
    setSelectedApp(app);
    setForm({
      owner: app.owner,
      name: app.name,
      url: app.url,
      icon: app.icon,
      color: app.color,
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedApp) return;

    try {
      setSaving(true);

      await apiFetch(`/applications/${selectedApp.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      setData(prev =>
        prev.map(app =>
          app.id === selectedApp.id ? { ...app, ...form } : app
        )
      );

      setOpenEdit(false);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Application updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete application?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/applications/${id}`, {
        method: "DELETE",
      });

      setData(prev => prev.filter(app => app.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Application deleted successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err.message || "Something went wrong",
      });
    }
  };

  /* ================= COLUMNS ================= */
  const columns: ColumnDef<Application>[] = [
    { header: "Code", accessorKey: "code" },
    { header: "Application", accessorKey: "name" },
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDetail(app)}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(app)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(app.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
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
                    <TableHead key={h.id}>
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <ChevronsUpDown className="h-3 w-3" />
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

      {/* DETAIL DIALOG */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Detail</DialogTitle>
            <DialogDescription>View application information</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Code</Label>
                <p className="font-medium">{selectedApp.code}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Application Name</Label>
                <p className="font-medium">{selectedApp.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Owner</Label>
                <p className="font-medium">{selectedApp.owner}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">URL</Label>
                <p className="font-medium">{selectedApp.url}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Icon</Label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = Icons[selectedApp.icon as keyof typeof Icons] as LucideIcon | undefined;
                    return Icon ? <Icon className="h-5 w-5" /> : "-";
                  })()}
                  <span className="font-medium">{selectedApp.icon}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: selectedApp.color }}
                  />
                  <span className="font-medium">{selectedApp.color}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetail(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>Update application</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {[
              { label: "Owner", key: "owner" },
              { label: "Application Name", key: "name" },
              { label: "URL", key: "url" },
              { label: "Lucide Icon", key: "icon" },
              { label: "Color", key: "color" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                  value={(form as any)[f.key]}
                  onChange={e =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}