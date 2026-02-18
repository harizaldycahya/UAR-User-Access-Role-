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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { ChevronsUpDown } from "lucide-react";

import RequestTableSkeleton from "./RequestTableSkeleton";
import { apiFetch } from "@/lib/api";

/* ================= TYPES ================= */
interface User {
    id: number;
    username: string;
    nama_user: string;
    is_active: number;
    role_id: number;
    role_name: string;
    created_at: string;
    current_login_at: string | null;
    current_login_ip: string | null;
    prev_login_at: string | null;
    prev_login_ip: string | null;
}

/* ================= COMPONENT ================= */
export default function UsersTable() {
    const [data, setData] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [columnFilters, setColumnFilters] = React.useState<any[]>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");



    /* ================= FETCH ================= */
    React.useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch("/users");
                setData(res.data);
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatIP = (ip?: string | null) => {
        if (!ip) return "-";

        const localIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];

        if (localIPs.includes(ip)) return "Local";

        return ip;
    };

    const formatDate = (date?: string | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleString();
    };

    /* ================= COLUMNS ================= */
    const columns: ColumnDef<User>[] = [
        { header: "Username", accessorKey: "username" },
        { header: "Nama", accessorKey: "nama_user" },
        { header: "Role", accessorKey: "role_name" },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: ({ getValue }) => {
                const active = getValue<number>() === 1;
                return (
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {active ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            header: "Current Login",
            cell: ({ row }) => {
                const date = row.original.current_login_at;
                const ip = row.original.current_login_ip;

                return (
                    <div className="text-sm leading-tight">
                        <div>{formatDate(date)}</div>
                        <div className="text-muted-foreground text-xs">
                            {formatIP(ip)}
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Last Login",
            cell: ({ row }) => {
                const date = row.original.prev_login_at;
                const ip = row.original.prev_login_ip;

                return (
                    <div className="text-sm leading-tight">
                        <div>{formatDate(date)}</div>
                        <div className="text-muted-foreground text-xs">
                            {formatIP(ip)}
                        </div>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: { columnFilters, sorting, globalFilter },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const getPaginationRange = (
        currentPage: number,
        totalPages: number
    ) => {
        // Jika total pages <= 7, tampilkan semua
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const range: (number | string)[] = [];

        // Jika di awal (page 1-4), tampilkan: 1 2 3 4 5 ... last (7 slot)
        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) {
                range.push(i);
            }
            range.push("...");
            range.push(totalPages);
        }
        // Jika di akhir (4 pages terakhir), tampilkan: 1 ... last-4 last-3 last-2 last-1 last (7 slot)
        else if (currentPage >= totalPages - 3) {
            range.push(1);
            range.push("...");
            for (let i = totalPages - 4; i <= totalPages; i++) {
                range.push(i);
            }
        }
        // Jika di tengah, tampilkan: 1 ... current-1 current current+1 ... last (7 slot)
        else {
            range.push(1);
            range.push("...");
            range.push(currentPage - 1);
            range.push(currentPage);
            range.push(currentPage + 1);
            range.push("...");
            range.push(totalPages);
        }

        return range;
    };



    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1; // 1-based

    if (loading) return <RequestTableSkeleton />;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between">
                <div>
                    <CardTitle className="text-lg">Users List</CardTitle>
                    <CardDescription>List of registered users</CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-64 border rounded px-3 py-2 text-sm"
                    />
                </div>

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                    <TableHead key={h.id}>
                                        {h.isPlaceholder ? null : (
                                            <div
                                                className="flex items-center gap-1 cursor-pointer select-none"
                                                onClick={h.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    h.column.columnDef.header,
                                                    h.getContext()
                                                )}
                                                <ChevronsUpDown className="h-3 w-3" />
                                            </div>
                                        )}
                                    </TableHead>

                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <CardFooter className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    {getPaginationRange(currentPage, totalPages).map((page, idx) => {
                        if (page === "...") {
                            return (
                                <span key={idx} className="px-2 text-muted-foreground">
                                    ...
                                </span>
                            );
                        }

                        const pageNumber = page as number;

                        return (
                            <button
                                key={idx}
                                onClick={() => table.setPageIndex(pageNumber - 1)}
                                className={`px-3 py-1 rounded ${pageNumber === currentPage ? "bg-primary text-white" : ""
                                    }`}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>

                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
            </CardFooter>

        </Card>
    );
}
