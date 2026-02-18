"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiAxios } from "@/lib/api";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";

/* =======================
   TYPES
======================= */

interface User {
    username: string;
    role_name: string;
    is_active: boolean;
    current_login_at: string | null;
    prev_login_at: string | null;
    current_login_ip: string | null;
    current_login_api: string | null;
    last_password_changed_at: string | null; 
}

interface HrProfile {
    nama: string;
    nik: string;
    email: string;
    telp: string;
    nama_divisi: string;
    posisi: string;
    lokasi_kerja: string;
    tanggal_masuk: string;
}

interface UserDetail {
    user: User;
    hr_profile: HrProfile;
    photo_url: string | null;
}

/* =======================
   COMPONENT
======================= */

export default function UserDetailPage() {
    const params = useParams();
    const username = params?.username as string;

    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);

    /* =======================
       HELPERS
    ======================= */

    const formatDate = (date?: string | null) => {
        if (!date) return "-";

        const d = new Date(date);

        const tanggal = d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const waktu = d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        return `${tanggal}, ${waktu} WIB`;
    };

    /* =======================
       FETCH USER
    ======================= */

    const fetchUser = async () => {
        if (!username) return;

        try {
            setLoading(true);
            const res = await apiAxios.get(`/users/${username}`);
            setData(res.data.data);
        } catch (error) {
            console.error("Fetch user error:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [username]);

    /* =======================
       RESET PASSWORD
    ======================= */

    const handleResetPassword = async () => {
        if (!data?.user) return;

        const confirm = await Swal.fire({
            icon: "warning",
            title: "Reset Password?",
            text: `Password user ${data.user.username} akan direset ke: 2026rising8`,
            showCancelButton: true,
            confirmButtonText: "Yes, Reset",
        });

        if (!confirm.isConfirmed) return;

        try {
            setIsResetting(true);

            await apiAxios.post(
                `/users/${data.user.username}/reset-password`,
                {
                    newPassword: "2026rising8",
                }
            );

            await Swal.fire({
                icon: "success",
                title: "Success",
                text: "Password berhasil direset ke 2026rising8",
            });
        } catch (err: any) {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    err.response?.data?.message ||
                    err.message ||
                    "Gagal reset password",
            });
        } finally {
            setIsResetting(false);
        }
    };

    /* =======================
       LOADING STATE
    ======================= */

    if (loading) {
        return (
            <main className="p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </main>
        );
    }

    if (!data) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-semibold">User not found</h1>
            </main>
        );
    }

    const { user, hr_profile, photo_url } = data;

    function timeAgo(dateString?: string | null) {
        if (!dateString) return "Not available";

        const past = new Date(dateString).getTime();
        const now = Date.now();

        const diffMs = now - past;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;

        return "Just now";
    }

    /* =======================
       UI
    ======================= */

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">User Profile</h1>
                    <p className="text-muted-foreground text-sm">
                        Detailed information for {user.username}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT PROFILE CARD */}
                    <div>
                        <Card>
                            <CardContent className="p-6 text-center">
                                <Avatar className="w-32 h-32 mx-auto mb-4">
                                    <AvatarImage
                                        src={photo_url || undefined}
                                    />
                                    <AvatarFallback>
                                        {hr_profile?.nama
                                            ?.split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>

                                <h2 className="text-xl font-semibold">
                                    {hr_profile?.nama}
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    {hr_profile?.nik}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {hr_profile?.nama_divisi}
                                </p>

                                <Separator className="my-4" />

                                <div className="space-y-3 text-left text-sm">
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                                        {hr_profile?.email || "-"}
                                    </div>

                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                                        {hr_profile?.telp || "-"}
                                    </div>

                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                                        {hr_profile?.lokasi_kerja || "-"}
                                    </div>

                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                                        Joined{" "}
                                        {formatDate(
                                            hr_profile?.tanggal_masuk
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* PERSONAL INFO */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    Employee personal details
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <strong>Full Name:</strong>{" "}
                                    {hr_profile?.nama}
                                </div>

                                <div>
                                    <strong>Email:</strong>{" "}
                                    {hr_profile?.email}
                                </div>

                                <div>
                                    <strong>Phone:</strong>{" "}
                                    {hr_profile?.telp}
                                </div>

                                <div>
                                    <strong>Department:</strong>{" "}
                                    {hr_profile?.nama_divisi}
                                </div>

                                <div>
                                    <strong>Position:</strong>{" "}
                                    {hr_profile?.posisi}
                                </div>

                                <div>
                                    <strong>Location:</strong>{" "}
                                    {hr_profile?.lokasi_kerja}
                                </div>

                                <div>
                                    <strong>Join Date:</strong>{" "}
                                    {formatDate(hr_profile?.tanggal_masuk)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* SYSTEM INFO */}
                        <Card>
                            <CardHeader>
                                <CardTitle>System Information</CardTitle>
                                <CardDescription>
                                    Internal account details
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <strong>Username:</strong>{" "}
                                    {user.username}
                                </div>

                                <div>
                                    <strong>Role:</strong>{" "}
                                    {user.role_name}
                                </div>

                                <div>
                                    <strong>Status:</strong>{" "}
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            user.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <div>
                                    <strong>Last Password Changed:</strong>{" "}
                                    {timeAgo(user.last_password_changed_at)} ( {formatDate(user.last_password_changed_at)} ) 
                                </div>

                                <div>
                                    <strong>Current Login:</strong>{" "}
                                    {timeAgo(user.current_login_at)} ( {formatDate(user.current_login_at)} )
                                </div>

                                <div>
                                    <strong>Previous Login:</strong>{" "}
                                    {timeAgo(user.prev_login_at)} ( {formatDate(user.prev_login_at)} )
                                </div>

                                <div>
                                    <strong>Current Login IP:</strong>{" "}
                                    {user.current_login_ip || "-"}
                                </div>

                                <div>
                                    <strong>Current Login API:</strong>{" "}
                                    {user.current_login_api || "-"}
                                </div>

                                <Separator />

                                <div className="pt-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleResetPassword}
                                        disabled={isResetting}
                                    >
                                        {isResetting ? "Resetting..." : "Reset Password"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </main>
    );
}
