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
import { useToast } from "@/components/ui/use-toast";
import Swal from "sweetalert2";




/* ================= TYPES ================= */
interface ApplicationRole {
    id: number;
    name: string;
    description: string;
}
/* ================= COMPONENT ================= */
export default function RoleTable({
    applicationId,
}: {
    applicationId: string;
}) {
    const [data, setData] = React.useState<ApplicationRole[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<any[]>([]);

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<ApplicationRole | null>(null);
    const [form, setForm] = React.useState({
        name: "",
        description: "",
    });
    const { toast } = useToast();



    /* ================= FETCH ================= */
    React.useEffect(() => {
        if (!applicationId) return;

        const load = async () => {
            try {
                const res = await apiFetch(
                    `/applications/${applicationId}/roles`
                );
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch roles", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [applicationId]);


    /* ================= COLUMNS ================= */
    const columns: ColumnDef<ApplicationRole>[] = [
        {
            header: "No",
            cell: ({ row }) => row.index + 1,
        },
        {
            header: "Role Name",
            accessorKey: "name",
        },
        {
            header: "Description",
            accessorKey: "description",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const role = row.original;

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setEditingRole(role);
                                setForm({
                                    name: role.name,
                                    description: role.description,
                                });
                            }}
                        >
                            Edit
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(role.id)}
                        >
                            Delete
                        </Button>
                    </div>
                );
            },

        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: {
            columnFilters,
            sorting,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleSubmit = async () => {
        if (!form.name) return;

        setIsSubmitting(true);

        try {
            if (editingRole) {
                // UPDATE
                const res = await apiFetch(
                    `/application-roles/${editingRole.id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(form),
                    }
                );

                setData(prev =>
                    prev.map(r => (r.id === editingRole.id ? res.data : r))
                );

                toast({
                    title: "Role updated",
                    description: "Application role berhasil diperbarui",
                });
            } else {
                // CREATE
                const res = await apiFetch(
                    `/applications/${applicationId}/roles`,
                    {
                        method: "POST",
                        body: JSON.stringify(form),
                    }
                );

                setData(prev => [...prev, res.data]);

                toast({
                    title: "Role created",
                    description: "Application role berhasil ditambahkan",
                });
            }

            setForm({ name: "", description: "" });
            setEditingRole(null);
        } catch (e) {
            console.error("Submit failed", e);

            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Terjadi kesalahan saat menyimpan data",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Delete role?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await apiFetch(`/application-roles/${id}`, {
                method: "DELETE",
            });

            setData(prev => prev.filter(r => r.id !== id));

            Swal.fire({
                title: "Deleted",
                text: "Role has been deleted.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (e) {
            console.error("Delete failed", e);

            Swal.fire({
                title: "Failed",
                text: "Failed to delete role.",
                icon: "error",
            });
        }
    };







    if (loading) return <RequestTableSkeleton />;

    return (
        <>
            {/* TABLE */}
            <Card>
                <CardHeader className="flex flex-row justify-between">

                    <div>
                        <CardTitle className="text-lg">Application Roles</CardTitle>
                        <CardDescription>
                            Roles available for this application
                        </CardDescription>
                    </div>

                    {/* <Button
                        size="sm"
                        onClick={() => {
                            setEditingRole(null);
                            setForm({ name: "", description: "" });
                        }}
                    >
                        + Add Role
                    </Button> */}
                    <div className="flex gap-2 mt-4">
                        <Input
                            placeholder="Role name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                        <Input
                            placeholder="Description"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {editingRole ? "Update" : "+ Create"}
                        </Button>
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


        </>
    );
}