'use client';

import React from 'react';
import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
    SidebarProvider,
    Sidebar,
    SidebarInset,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarTrigger,
} from '@/components/ui/sidebar';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { cn } from '@/lib/utils';

import {
    LayoutDashboard,
    User,
    Settings,
    Bell,
    LogOut,
    FilePlus,
    ClipboardList,
    Clock,
    CheckCircle,
    Book,
} from 'lucide-react';
import { apiAxios } from '@/lib/api';

type MenuItem = {
    label: string;
    icon: React.ReactNode;
    href: string;
};

type MenuGroup = {
    label?: string;
    items: MenuItem[];
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<any>(null);
    const [profile, setProfile] = React.useState<any>(null);
    const [Foto, setFoto] = React.useState<any>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    React.useEffect(() => {
        if (!user?.username) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(
                    `https://personasys.triasmitra.com/api/auth/get-profile-uar?nik=${user.username}`
                );
                const result = await res.json();
                if (result.Success) {
                    const d = result.data;
                    setProfile({
                        name: d.nama,
                        email: d.email,
                        phone: d.telp,
                        department: d.nama_divisi,
                        position: d.jabatan,
                        photo: d.foto,
                        nik: d.nik,
                    });
                }
            } catch (error) {
                console.error("Failed fetch profile:", error);
            }
        };

        fetchProfile();
    }, [user]);

    React.useEffect(() => {
        if (!profile?.nik) return;

        const fetchPhoto = async () => {
            try {
                const res = await fetch(
                    `https://personasys.triasmitra.com/api/aas-gateway/get-photo-url?nik=${profile.nik}`
                );
                const result = await res.json();
                if (result.Success) {
                    setFoto(result.photo_url);
                }
            } catch (err) {
                console.error("Failed fetch photo:", err);
            }
        };

        fetchPhoto();
    }, [profile]);

    const segments = React.useMemo(() => pathname?.split("/").filter(Boolean) || [], [pathname]);

    const logout = async () => {
        try {
            await apiAxios.post("/auth/logout");
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            document.cookie = "token=; path=/; max-age=0";
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    };

    // Helper: cek apakah item sedang aktif
    const isItemActive = (href: string): boolean => {
        const [hrefPath, hrefQuery] = href.split("?");

        // Jika href punya query string → harus exact match path DAN query
        // Contoh: "/approvals?status=pending" hanya aktif kalau pathname="/approvals" DAN searchParams="status=pending"
        if (hrefQuery) {
            if (pathname !== hrefPath) return false;
            const params = new URLSearchParams(hrefQuery);
            for (const [key, value] of params.entries()) {
                if (searchParams.get(key) !== value) return false;
            }
            return true;
        }

        // Kumpulkan semua href tanpa query dari role ini yang lebih spesifik dari hrefPath
        // "Lebih spesifik" = path-nya merupakan sub-path dari hrefPath
        // Contoh: "/requests/create" lebih spesifik dari "/requests"
        const allPathHrefs = (menuByRole[user?.role_name] || [])
            .flatMap(g => g.items.map(i => i.href.split("?")[0]))
            .filter(h => h !== hrefPath && h.startsWith(hrefPath + "/"));

        // Jika ada sibling yang lebih spesifik yang cocok dengan pathname saat ini,
        // item ini TIDAK aktif — biarkan yang lebih spesifik menang
        const moreSpecificIsActive = allPathHrefs.some(
            h => pathname === h || pathname.startsWith(h + "/")
        );

        if (moreSpecificIsActive) return false;

        // Cek exact match atau prefix match
        return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    };

    // Menu berdasarkan role
    const menuByRole: Record<string, MenuGroup[]> = {
        user: [
            {
                items: [
                    { label: "Dashboard", icon: <LayoutDashboard className="h-[18px] w-[18px]" />, href: "/dashboard" },
                ],
            },
            {
                label: "Application Request",
                items: [
                    { label: "Create New Request", icon: <FilePlus className="h-[18px] w-[18px]" />, href: "/requests/create" },
                    { label: "My Request", icon: <ClipboardList className="h-[18px] w-[18px]" />, href: "/requests" },
                ],
            },
            {
                label: "Request Approval",
                items: [
                    { label: "Approval Pending", icon: <Clock className="h-[18px] w-[18px]" />, href: "/approvals?status=pending" },
                    { label: "History Approvals", icon: <CheckCircle className="h-[18px] w-[18px]" />, href: "/approvals?status=history" },
                ],
            },
            {
                label: "Account",
                items: [
                    { label: "My Profile", icon: <User className="h-[18px] w-[18px]" />, href: "/profile" },
                    { label: "Guide Book", icon: <Book className="h-[18px] w-[18px]" />, href: "/guide" },
                ],
            },
        ],
        admin: [
            {
                label: "Applications",
                items: [
                    { label: "Applications", icon: <FilePlus className="h-[18px] w-[18px]" />, href: "/applications" },
                    { label: "Create Application", icon: <ClipboardList className="h-[18px] w-[18px]" />, href: "/applications/create" },
                ],
            },
            {
                label: "Users",
                items: [
                    { label: "Users", icon: <FilePlus className="h-[18px] w-[18px]" />, href: "/users" },
                ],
            },
        ],
        hrd: [
            {
                label: "Request Approval",
                items: [
                    { label: "Approval Pending", icon: <Clock className="h-[18px] w-[18px]" />, href: "/approvals?status=pending" },
                    { label: "History Approvals", icon: <CheckCircle className="h-[18px] w-[18px]" />, href: "/approvals?status=history" },
                ],
            },
        ],
    };

    const renderMenu = () => {
        if (!user) return null;
        const groups = menuByRole[user.role_name] || [];

        return groups.map((group, idx) => (
            <SidebarGroup key={idx} className="mb-2">
                {group.label && (
                    <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 dark:text-sidebar-foreground/30">
                        {group.label}
                    </SidebarGroupLabel>
                )}
                <SidebarMenu className="space-y-0.5">
                    {group.items.map((item, i) => {
                        const active = mounted && isItemActive(item.href);

                        return (
                            <SidebarMenuItem key={i}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    className={cn(
                                        // Base
                                        "relative h-11 w-full rounded-lg px-3 transition-all duration-150 ease-out",
                                        "flex items-center gap-3 text-sm font-medium",
                                        // Inactive state
                                        !active && [
                                            "text-sidebar-foreground/60 dark:text-sidebar-foreground/50",
                                            "hover:text-sidebar-foreground dark:hover:text-sidebar-foreground",
                                            "hover:bg-sidebar-accent/50 dark:hover:bg-white/5",
                                        ],
                                        // Active state
                                        active && [
                                            "text-primary dark:text-primary",
                                            "bg-primary/10 dark:bg-primary/15",
                                            "font-semibold",
                                            "shadow-sm",
                                        ]
                                    )}
                                >
                                    <Link href={item.href} className="flex items-center gap-3 w-full">
                                        {/* Left accent bar */}
                                        <span
                                            className={cn(
                                                "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
                                                active
                                                    ? "h-6 bg-primary opacity-100"
                                                    : "h-0 opacity-0"
                                            )}
                                        />

                                        {/* Icon */}
                                        <span
                                            className={cn(
                                                "shrink-0 transition-all duration-150",
                                                active
                                                    ? "text-primary scale-110"
                                                    : "text-sidebar-foreground/50 dark:text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                                            )}
                                        >
                                            {item.icon}
                                        </span>

                                        {/* Label */}
                                        <span className="truncate">{item.label}</span>

                                        {/* Active dot */}
                                        {active && (
                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0 opacity-70" />
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>
        ));
    };

    return (
        <SidebarProvider>
            <div className="flex w-full bg-background" suppressHydrationWarning>
                <Sidebar className="border-r border-sidebar-border dark:border-white/5">
                    <SidebarHeader>
                        <div className="px-5 py-5">
                            <div className="flex items-center gap-3 px-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/30">
                                    <img src="/logo.png" alt="Ketrosden Logo" className="h-6 w-6 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold tracking-wide text-sidebar-foreground">KETROSDEN</div>
                                    <div className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase opacity-60">TRIASMITRA</div>
                                </div>
                            </div>
                        </div>

                        {/* Thin separator */}
                        <div className="mx-4 h-px bg-sidebar-border dark:bg-white/5" />
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-4">{renderMenu()}</SidebarContent>
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-20 items-center gap-6 border-b border-border/60 dark:border-white/5 px-6 bg-card/80 dark:bg-card/50 backdrop-blur-sm">
                        <SidebarTrigger className="h-10 w-10 rounded-lg hover:bg-accent dark:hover:bg-white/5 transition-colors" />

                        {mounted && segments.length > 0 && (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {segments.map((segment, index) => {
                                        const href = "/" + segments.slice(0, index + 1).join("/");
                                        const label = segment.replace(/-/g, " ");

                                        return (
                                            <React.Fragment key={href}>
                                                {index > 0 && <BreadcrumbSeparator />}
                                                <BreadcrumbItem>
                                                    {index === segments.length - 1 ? (
                                                        <BreadcrumbPage className="capitalize font-semibold text-foreground">
                                                            {label}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink href={href} className="capitalize text-muted-foreground hover:text-foreground transition-colors">
                                                            {label}
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                            </React.Fragment>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        )}

                        <div className="ml-auto flex items-center gap-3">
                            {mounted && <ThemeSwitcher />}

                            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 dark:border-white/10 hover:bg-accent dark:hover:bg-white/5 transition-colors">
                                <Bell className="h-[18px] w-[18px]" />
                            </button>

                            {mounted && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-border dark:ring-white/10 hover:ring-primary/50 transition-all duration-200">
                                            <AvatarImage
                                                src={Foto || undefined}
                                                alt={profile?.name || "User"}
                                            />
                                            <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold">
                                                {profile?.name
                                                    ?.split(" ")
                                                    .map((n: string) => n[0])
                                                    .join("")
                                                    .slice(0, 2) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-64 p-2 dark:bg-card dark:border-white/10">
                                        <DropdownMenuLabel className="p-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-base font-semibold text-foreground">
                                                    {profile?.name || "Loading..."}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {profile?.email || "-"}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator className="dark:bg-white/5" />

                                        <a href='/profile'>
                                            <DropdownMenuItem className="py-2.5 cursor-pointer rounded-md">
                                                <User className="mr-3 h-4 w-4" /> Profile
                                            </DropdownMenuItem>
                                        </a>

                                        <DropdownMenuItem className="py-2.5 cursor-pointer rounded-md">
                                            <Settings className="mr-3 h-4 w-4" /> Settings
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="dark:bg-white/5" />

                                        <DropdownMenuItem
                                            className="py-2.5 text-destructive hover:text-destructive focus:text-destructive cursor-pointer rounded-md"
                                            onClick={logout}
                                        >
                                            <LogOut className="mr-3 h-4 w-4" /> Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </header>

                    <main className="p-8">{children}</main>

                    <footer className="border-t border-border/40 dark:border-white/5 bg-card/60 dark:bg-card/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between px-8 py-4 text-xs text-muted-foreground">
                            <span>© 2025 Ketrosden Triasmitra • Developer Team</span>
                            <div className="flex items-center gap-4">
                                <span>v1.0.0</span>
                                <span className="opacity-40">•</span>
                                <span>Last update: 15 Jan 2025</span>
                            </div>
                        </div>
                    </footer>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}