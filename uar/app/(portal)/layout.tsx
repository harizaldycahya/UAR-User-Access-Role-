'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
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

    const logout = () => {
        document.cookie = "token=; path=/; max-age=0";
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    // Menu berdasarkan role
    const menuByRole: Record<string, MenuGroup[]> = {
        user: [
            {
                items: [
                    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
                ],
            },
            {
                label: "Application Request",
                items: [
                    { label: "Create New Request", icon: <FilePlus className="h-5 w-5" />, href: "/requests/create" },
                    { label: "My Request", icon: <ClipboardList className="h-5 w-5" />, href: "/requests" },
                ],
            },
            {
                label: "Request Approval",
                items: [
                    { label: "Approval Pending", icon: <Clock className="h-5 w-5" />, href: "/approvals?status=pending" },
                    { label: "History Approvals", icon: <CheckCircle className="h-5 w-5" />, href: "/approvals?status=history" },
                ],
            },
            {
                label: "Account",
                items: [
                    { label: "My Profile", icon: <User className="h-5 w-5" />, href: "/profile" },
                    { label: "Guide Book", icon: <Book className="h-5 w-5" />, href: "/profile" },
                ],
            },
        ],
        admin: [
            {
                label: "Applications",
                items: [
                    { label: "Applications", icon: <FilePlus className="h-5 w-5" />, href: "/applications" },
                    { label: "Create Application", icon: <ClipboardList className="h-5 w-5" />, href: "/create_application" },
                ],
            },
            {
                label: "Users",
                items: [
                    { label: "Users", icon: <FilePlus className="h-5 w-5" />, href: "/applications" },
                ],
            },
        ],
        hrd: [
            {
                label: "Request Approval",
                items: [
                    { label: "Approval Pending", icon: <Clock className="h-5 w-5" />, href: "/approvals?status=pending" },
                    { label: "History Approvals", icon: <CheckCircle className="h-5 w-5" />, href: "/approvals?status=history" },
                ],
            },
        ],
    };

    const renderMenu = () => {
        if (!user) return null;
        const groups = menuByRole[user.role_name] || [];
        return groups.map((group, idx) => (
            <SidebarGroup key={idx}>
                {group.label && (
                    <SidebarGroupLabel className="px-4 mb-2 text-sm font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                        {group.label}
                    </SidebarGroupLabel>
                )}
                <SidebarMenu className="space-y-1">
                    {group.items.map((item, i) => (
                        <SidebarMenuItem key={i}>
                            <SidebarMenuButton asChild className="h-12 rounded-lg hover:bg-accent">
                                <Link href={item.href} className="flex gap-3 px-4 items-center">
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        ));
    };

    return (
        <SidebarProvider>
            <div className="flex w-full bg-background" suppressHydrationWarning>
                <Sidebar className="border-r-2 border-sidebar-border">
                    <SidebarHeader>
                        <div className="p-6">
                            <div className="flex items-center gap-4 px-2">
                                <img src="/logo.png" alt="Ketrosden Logo" className="h-12 w-12 object-contain" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold tracking-wide">KETROSDEN</div>
                                    <div className="text-xs text-muted-foreground font-medium tracking-wide">TRIASMITRA</div>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-4">{renderMenu()}</SidebarContent>
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-20 items-center gap-6 border-b-2 px-6 bg-card/80 backdrop-blur-sm">
                        <SidebarTrigger className="h-10 w-10 rounded-lg hover:bg-accent" />
                        {mounted && segments.length > 0 && (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {segments.map((segment, index) => {
                                        const href = "/" + segments.slice(0, index + 1).join("/");
                                        const label = segment.replace(/-/g, " ");

                                        return (
                                            <React.Fragment key={href}>
                                                {index > 0 && <BreadcrumbSeparator />} {/* separator mulai dari item kedua */}
                                                <BreadcrumbItem>
                                                    {index === segments.length - 1 ? (
                                                        <BreadcrumbPage className="capitalize font-semibold">
                                                            {label}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink href={href} className="capitalize">
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


                        <div className="ml-auto flex items-center gap-4">
                            {mounted && <ThemeSwitcher />}

                            <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border-2">
                                <Bell className="h-5 w-5" />
                            </button>

                            {mounted && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-border">
                                            <AvatarImage
                                                src={Foto || undefined}
                                                alt={profile?.name || "User"}
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                                {profile?.name
                                                    ?.split(" ")
                                                    .map((n: string) => n[0])
                                                    .join("") || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-64 p-2">
                                        <DropdownMenuLabel className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-semibold">
                                                    {profile?.name || "Loading..."}
                                                </span>

                                                <span className="text-sm text-muted-foreground">
                                                    {profile?.email || "-"}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <a href='/profile'>
                                            <DropdownMenuItem className="py-3">
                                                <User className="mr-3 h-5 w-5" /> Profile
                                            </DropdownMenuItem>
                                        </a>

                                        <DropdownMenuItem className="py-3">
                                            <Settings className="mr-3 h-5 w-5" /> Settings
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem className="py-3 text-destructive " onClick={logout}>
                                            <DropdownMenuItem className="py-3 text-destructive cursor-pointer">
                                                <LogOut className="mr-3 h-5 w-5" /> Logout
                                            </DropdownMenuItem>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </header>

                    <main className="p-8">{children}</main>
                    {/* Footer */}
                    <footer className="border-t border-border/40 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between px-8 py-4 text-xs text-muted-foreground">
                            <span>
                                © 2025 Ketrosden Triasmitra • Developer Team
                            </span>

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

