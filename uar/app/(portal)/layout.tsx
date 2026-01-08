'use client';

import React from 'react';
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
    KeyRound,
    Book,
} from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    // Semua hooks dipanggil di awal, tidak di-conditional
    const pathname = usePathname();
    const { theme } = useTheme();

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const segments = mounted
        ? pathname.split('/').filter(Boolean).slice(1)
        : [];

    const logout = () => {
        // hapus cookie token
        document.cookie = "token=; path=/; max-age=0";

        // bersih-bersih tambahan
        localStorage.removeItem("token");

        // tendang ke login
        window.location.href = "/login";
    };


    return (
        <SidebarProvider>
            <div className="flex w-full bg-background" suppressHydrationWarning>
                {/* Sidebar */}
                <Sidebar className="border-r-2 border-sidebar-border">
                    <SidebarHeader>
                        <div className="p-6">
                            <div className="flex items-center gap-4 px-2">
                                <img
                                    src="/logo.png"
                                    alt="Ketrosden Logo"
                                    className="h-12 w-12 object-contain"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold tracking-wide">KETROSDEN</div>
                                    <div className="text-xs text-muted-foreground font-medium tracking-wide">
                                        TRIASMITRA
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-4">
                        {/* Dashboard */}
                        <SidebarGroup>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 text-sm font-medium hover:bg-accent rounded-lg">
                                        <a href="/dashboard" className="flex items-center gap-3 px-4">
                                            <LayoutDashboard className="h-5 w-5" />
                                            Dashboard
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Application Request */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-4 mb-2 text-sm font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Application Request
                            </SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/requests/create" className="flex gap-3 px-4">
                                            <FilePlus className="h-5 w-5" />
                                            Create New Request
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/requests" className="flex gap-3 px-4">
                                            <ClipboardList className="h-5 w-5" />
                                            My Request
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Request Approval */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-4 mb-2 text-sm font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Request Approval
                            </SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/approvals?status=Pending" className="flex gap-3 px-4">
                                            <Clock className="h-5 w-5" />
                                            Approval Pending
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/approvals" className="flex gap-3 px-4">
                                            <CheckCircle className="h-5 w-5" />
                                            History Approvals
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Account */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-4 mb-2 text-sm font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Account
                            </SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/profile" className="flex gap-3 px-4">
                                            <User className="h-5 w-5" />
                                            My Profile
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/change_password" className="flex gap-3 px-4">
                                            <Book className="h-5 w-5" />
                                            Guide Book
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Admin Menu */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-4 mb-2 text-sm font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Management Applications
                            </SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/applications" className="flex gap-3 px-4">
                                            <FilePlus className="h-5 w-5" />
                                            Applications
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                                        <a href="/create_application" className="flex gap-3 px-4">
                                            <ClipboardList className="h-5 w-5" />
                                            Create Application
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                        
                    </SidebarContent>
                </Sidebar>

                {/* Main content */}
                <SidebarInset>
                    <header className="flex h-20 items-center gap-6 border-b-2 px-6 bg-card/80 backdrop-blur-sm">
                        <SidebarTrigger className="h-10 w-10 rounded-lg hover:bg-accent" />
                        {mounted && segments.length > 0 && (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                                    </BreadcrumbItem>

                                    {segments.map((segment, index) => {
                                        const href = '/' + segments.slice(0, index + 1).join('/');
                                        const label = segment.replace(/-/g, ' ');

                                        return (
                                            <React.Fragment key={href}>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    {index === segments.length - 1 ? (
                                                        <BreadcrumbPage className="font-semibold capitalize">
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
                                            <AvatarImage src="/avatar.png" />
                                            <AvatarFallback>Z</AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-64 p-2">
                                        <DropdownMenuLabel className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-semibold">Zaldy</span>
                                                <span className="text-sm text-muted-foreground">zaldy@company.com</span>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem className="py-3">
                                            <User className="mr-3 h-5 w-5" /> Profile
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="py-3">
                                            <Settings className="mr-3 h-5 w-5" /> Settings
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem className="py-3 text-destructive " onClick={logout}> 
                                            <DropdownMenuItem
                                                className="py-3 text-destructive cursor-pointer"
                                                
                                            >
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
