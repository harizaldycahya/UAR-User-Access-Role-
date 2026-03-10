'use client';

import React, { Suspense } from 'react';
import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation';
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
    LogOut,
    FilePlus,
    ClipboardList,
    Clock,
    CheckCircle,
    Book,
} from 'lucide-react';
import { apiAxios, apiFetch } from '@/lib/api';

type MenuItem = {
    label: string;
    icon: React.ReactNode;
    href: string;
};

type MenuGroup = {
    label?: string;
    items: MenuItem[];
};

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<any>(null);
    const [profile, setProfile] = React.useState<any>(null);
    const [foto, setFoto] = React.useState<any>(null);
    const [mounted, setMounted] = React.useState(false);

    const pathname = usePathname();
    const searchParams = useSearchParams();

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    React.useEffect(() => {
        if (!user?.username) return;
        const fetchProfile = async () => {
            try {
                const res = await fetch(`https://personasys.triasmitra.com/api/auth/get-profile-uar?nik=${user.username}`);
                const result = await res.json();
                if (result.Success) {
                    const d = result.data;
                    setProfile({ name: d.nama, email: d.email, department: d.nama_divisi, position: d.jabatan, nik: d.nik });
                }
            } catch (e) { console.error(e); }
        };
        fetchProfile();
    }, [user]);

    React.useEffect(() => {
        if (!profile?.nik) return;
        const fetchPhoto = async () => {
            try {
                const res = await fetch(`https://personasys.triasmitra.com/api/aas-gateway/get-photo-url?nik=${profile.nik}`);
                const result = await res.json();
                if (result.Success) setFoto(result.photo_url);
            } catch (e) { console.error(e); }
        };
        fetchPhoto();
    }, [profile]);

    const segments = React.useMemo(() => pathname?.split("/").filter(Boolean) || [], [pathname]);

    const logout = async () => {
        try { await apiAxios.post("/auth/logout"); }
        catch (e) { console.error(e); }
        finally {
            document.cookie = "token=; path=/; max-age=0";
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    };

    const menuByRole: Record<string, MenuGroup[]> = {
        user: [
            {
                items: [
                    { label: "Dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" />, href: "/dashboard" },
                ],
            },
            {
                label: "Application Request",
                items: [
                    { label: "Create New Request", icon: <FilePlus className="h-4.5 w-4.5" />, href: "/requests/create" },
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
                    { label: "Approval Pending", icon: <Clock className="h-[18px] w-[18px]" />, href: "/approvals?status=pending"},
                    { label: "History Approvals", icon: <CheckCircle className="h-[18px] w-[18px]" />, href: "/approvals?status=history" },
                ],
            },
        ],
    };

    const isItemActive = (href: string): boolean => {
        const [hrefPath, hrefQuery] = href.split("?");
        if (hrefQuery) {
            if (pathname !== hrefPath) return false;
            const params = new URLSearchParams(hrefQuery);
            for (const [key, value] of params.entries()) {
                if (searchParams.get(key) !== value) return false;
            }
            return true;
        }
        const allPathHrefs = (menuByRole[user?.role_name] || [])
            .flatMap(g => g.items.map(i => i.href.split("?")[0]))
            .filter(h => h !== hrefPath && h.startsWith(hrefPath + "/"));
        if (allPathHrefs.some(h => pathname === h || pathname.startsWith(h + "/"))) return false;
        return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    };

    const renderMenu = () => {
        if (!user) return null;
        const groups = menuByRole[user.role_name] || [];

        return groups.map((group, idx) => (
            <SidebarGroup key={idx} className="mb-2">
                {group.label && (
                    <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
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
                                    tooltip={item.label}
                                    className={cn(
                                        "h-10 rounded-lg text-sm font-medium transition-colors duration-150",
                                        // Inactive: pakai sidebar-foreground dari CSS var (putih)
                                        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                                        // Active: pill putih dengan teks biru (sidebar-primary)
                                        active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground font-semibold",
                                    )}
                                >
                                    <Link href={item.href} className="flex items-center gap-3 w-full px-3">
                                        <span className="shrink-0">{item.icon}</span>
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>
        ));
    };

    const initials = profile?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "U";

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full" suppressHydrationWarning>

                {/* ===== SIDEBAR ===== */}
                <Sidebar className="border-r-0">
                    {/* Header */}
                    <SidebarHeader className="shrink-0">
                        <div className="px-5 py-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent ring-1 ring-sidebar-border shrink-0">
                                    <img src="/logo.png" alt="Ketrosden Logo" className="h-6 w-6 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold tracking-wide text-sidebar-foreground">TRIASMITRA</p>
                                    <p className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">User Access Role</p>
                                </div>
                            </div>
                        </div>
                        <div className="mx-4 h-px bg-sidebar-border" />
                    </SidebarHeader>

                    {/* Menu */}
                    <SidebarContent className="px-3 py-4">
                        {renderMenu()}
                    </SidebarContent>

                    {/* User strip bawah */}
                    {mounted && profile && (
                        <div className="mx-3 mb-4 rounded-lg p-3 flex items-center gap-3 bg-sidebar-accent border border-sidebar-border">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={foto || undefined} alt={profile.name} />
                                <AvatarFallback className="text-xs font-bold bg-sidebar-primary text-sidebar-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-sidebar-foreground">{profile.name}</p>
                                <p className="text-[10px] truncate text-sidebar-foreground/50">{profile.position || profile.department || ""}</p>
                            </div>
                        </div>
                    )}
                </Sidebar>

                {/* ===== MAIN ===== */}
                <SidebarInset className="flex flex-col flex-1 min-h-screen">
                    <header className="shrink-0 flex h-20 items-center gap-6 border-b border-border/60 dark:border-white/5 px-6 bg-card/80 dark:bg-card/50 backdrop-blur-sm">
                        <SidebarTrigger className="h-10 w-10 rounded-lg hover:bg-accent transition-colors" />

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
                                                        <BreadcrumbPage className="capitalize font-semibold text-foreground">{label}</BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink href={href} className="capitalize text-muted-foreground hover:text-foreground transition-colors">{label}</BreadcrumbLink>
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
                            {mounted && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all duration-200">
                                            <AvatarImage src={foto || undefined} alt={profile?.name || "User"} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-2">
                                        <DropdownMenuLabel className="p-3">
                                            <p className="text-base font-semibold text-foreground">{profile?.name || "Loading..."}</p>
                                            <p className="text-xs text-muted-foreground">{profile?.email || "-"}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <a href='/profile'>
                                            <DropdownMenuItem className="py-2.5 cursor-pointer rounded-md">
                                                <User className="mr-3 h-4 w-4" /> Profile
                                            </DropdownMenuItem>
                                        </a>
                                        <DropdownMenuItem className="py-2.5 cursor-pointer rounded-md">
                                            <Settings className="mr-3 h-4 w-4" /> Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
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

                    <main className="flex-1 p-8">{children}</main>

                    <footer className="shrink-0 border-t border-border/40 bg-card/60">
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

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <PortalLayoutInner>{children}</PortalLayoutInner>
        </Suspense>
    );
}