"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

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
    Search
} from "lucide-react";

import { usePathname } from "next/navigation";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    {/* BRAND */}
                    <SidebarHeader>
                        <div className="px-4 py-3 text-lg font-semibold">
                            KETROSDEN TRIASMITRA
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* DASHBOARD */}
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/"}>
                                    <a href="/">
                                        <LayoutDashboard />
                                        <span>Dashboard</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>

                        {/* PAGES */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Pages</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/profile"}>
                                        <a href="/profile">
                                            <User />
                                            <span>User Profile</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                                        <a href="/settings">
                                            <Settings />
                                            <span>Account Settings</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <a href="/faq">
                                            <HelpCircle />
                                            <span>FAQ</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <a href="/pricing">
                                            <DollarSign />
                                            <span>Pricing</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* APPLICATIONS */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Applications</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/applications"}>
                                        <a href="/applications">
                                            <Grid />
                                            <span>Applications</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/requests"}>
                                        <a href="/requests">
                                            <Lock />
                                            <span>Access Requests</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* COMMUNICATION */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Communication</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <a href="/email">
                                            <Mail />
                                            <span>Email</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <a href="/chat">
                                            <MessageSquare />
                                            <span>Chat</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* ADMIN */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/users"}>
                                        <a href="/users">
                                            <Users />
                                            <span>Users</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>

                    {/* BOTTOM CARD */}
                    <div className="border-t p-4">
                        <Card className="bg-muted/50">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    {/* LEFT CONTENT */}
                                    <div className="flex flex-col gap-3">
                                        {/* ICON */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow">
                                            <FileText className="h-5 w-5" />
                                        </div>

                                        {/* TEXT */}
                                        <div>
                                            <p className="text-sm font-medium">
                                                Pending Approvals
                                            </p>
                                            <p className="mt-1 text-2xl font-bold">
                                                13
                                            </p>
                                        </div>
                                    </div>

                                    {/* AVATAR STACK */}
                                    <div className="flex -space-x-2 pt-1">
                                        <div className="h-6 w-6 rounded-full bg-background ring-2 ring-muted" />
                                        <div className="h-6 w-6 rounded-full bg-background ring-2 ring-muted" />
                                        <div className="h-6 w-6 rounded-full bg-background ring-2 ring-muted" />
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </Sidebar>

                {/* MAIN CONTENT */}
                <SidebarInset>
                    <SidebarInset>
                        {/* NAVBAR */}
                        <header className="flex h-14 items-center gap-4 border-b px-4">
                            {/* LEFT */}
                            <SidebarTrigger className="-ml-1" />

                            {/* SEARCH */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Type to search..."
                                    className="pl-9"
                                />
                            </div>

                            {/* RIGHT ICONS */}
                            <div className="ml-auto flex items-center gap-3">
                                <Bell className="h-5 w-5 text-muted-foreground cursor-pointer" />
                                <User className="h-6 w-6 rounded-full border p-1" />
                            </div>
                        </header>

                        {/* PAGE CONTENT */}
                        <main className="p-6">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
