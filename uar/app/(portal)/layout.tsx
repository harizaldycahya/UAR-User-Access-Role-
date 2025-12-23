"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
} from "@/components/ui/sidebar";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
    LayoutDashboard,
    User,
    Settings,
    HelpCircle,
    DollarSign,
    Grid,
    Lock,
    Mail,
    MessageSquare,
    Users,
    Bell,
    Search,
    LogOut
} from "lucide-react";

import { usePathname } from "next/navigation";
import React from "react";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .slice(1); // buang segment pertama (login)

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <Sidebar className="border-r-2 border-sidebar-border">
                    {/* BRAND */}
                    <SidebarHeader className="">
                        <div className="p-6">
                            <div className="flex items-center gap-4 px-2">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                    <img
                                        src="/logo.png"
                                        alt="Ketrosden Logo"
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-foreground tracking-wide">
                                        KETROSDEN
                                    </div>
                                    <div className="text-sm text-muted-foreground font-medium mt-0.5 tracking-wide">
                                        TRIASMITRA
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-4">
                        {/* PAGES */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-base font-semibold text-sidebar-foreground/70 px-4 mb-2">
                                Application
                            </SidebarGroupLabel>
                            <SidebarMenu className="space-y-1">
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === "/profile"}
                                        className="h-12 text-base font-medium hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-lg transition-colors"
                                    >
                                        <a href="/profile" className="flex items-center gap-3 px-4">
                                            <User className="h-5 w-5" />
                                            <span>User Profile</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === "/settings"}
                                        className="h-12 text-base font-medium hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-lg transition-colors"
                                    >
                                        <a href="/settings" className="flex items-center gap-3 px-4">
                                            <Settings className="h-5 w-5" />
                                            <span>Account Settings</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        className="h-12 text-base font-medium hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                                    >
                                        <a href="/faq" className="flex items-center gap-3 px-4">
                                            <HelpCircle className="h-5 w-5" />
                                            <span>FAQ</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        className="h-12 text-base font-medium hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                                    >
                                        <a href="/pricing" className="flex items-center gap-3 px-4">
                                            <DollarSign className="h-5 w-5" />
                                            <span>Pricing</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                    </SidebarContent>

                </Sidebar>

                {/* MAIN CONTENT */}
                <SidebarInset>
                    {/* NAVBAR */}
                    <header className="flex h-20 items-center gap-6 border-b-2 border-border px-6 bg-card/80 backdrop-blur-sm">
                        {/* LEFT */}
                        <SidebarTrigger className="h-10 w-10 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors" />

                        {/* BREADCRUMB */}
                        <div className="flex flex-1 items-center">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/" className="text-base">
                                            Home
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>

                                    {segments.map((segment, index) => {
                                        const href = "/" + segments.slice(0, index + 1).join("/");
                                        const label = segment.replace(/-/g, " ");

                                        return (
                                            <React.Fragment key={href}>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    {index === segments.length - 1 ? (
                                                        <BreadcrumbPage className="text-base font-semibold capitalize">
                                                            {label}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink
                                                            href={href}
                                                            className="text-base capitalize"
                                                        >
                                                            {label}
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                            </React.Fragment>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>


                        {/* RIGHT ICONS */}
                        <div className="ml-auto flex items-center gap-4">
                            {/* Theme Toggle */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted">
                                        {theme === "dark" ? (
                                            <Moon className="h-5 w-5" />
                                        ) : theme === "light" ? (
                                            <Sun className="h-5 w-5" />
                                        ) : (
                                            <Monitor className="h-5 w-5" />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                

                                <DropdownMenuContent align="end" className="w-48 p-2">
                                    <DropdownMenuItem
                                        className="text-base py-3 rounded-lg cursor-pointer"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="mr-3 h-5 w-5" />
                                        Light
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="text-base py-3 rounded-lg cursor-pointer"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="mr-3 h-5 w-5" />
                                        Dark
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="text-base py-3 rounded-lg cursor-pointer"
                                        onClick={() => setTheme("system")}
                                    >
                                        <Monitor className="mr-3 h-5 w-5" />
                                        System
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Notification */}
                            <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                                    3
                                </span>
                            </button>

                            {/* Avatar Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="outline-none">
                                        <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-border hover:ring-ring transition-all">
                                            <AvatarImage src="/avatar.png" alt="User" />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                                                Z
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-64 p-2">
                                    <DropdownMenuLabel className="p-3">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-semibold">Zaldy</span>
                                            <span className="text-sm text-muted-foreground mt-1">
                                                zaldy@company.com
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem className="text-base py-3 rounded-lg cursor-pointer">
                                        <User className="mr-3 h-5 w-5" />
                                        Profile
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="text-base py-3 rounded-lg cursor-pointer">
                                        <Settings className="mr-3 h-5 w-5" />
                                        Settings
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem className="text-base py-3 rounded-lg cursor-pointer text-destructive">
                                        <LogOut className="mr-3 h-5 w-5" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}
                    <main className="p-8">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}