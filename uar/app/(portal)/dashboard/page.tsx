'use client';

import React from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle
} from "@/components/ui/card";
import {
  MoreVertical, Calendar, ExternalLink,
  Bell, CheckCircle2, Lock, Clock,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { apiAxios } from "@/lib/api";
import Link from "next/link";

interface Role {
  id: number;
  name: string;
}

interface Application {
  id: number;
  code: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  has_access: boolean;
  granted_at: string | null;
  role: Role | null;
}

type Notification = {
  id: number;
  app_code: string;
  content: string;
  url?: string | null;
  notification_date: string;
  is_read: number; // 0 | 1
};

interface MyRequest {
  id: number;
  request_code: string;
  type: string;
  status: string;
  created_at: string;
  application: {
    id: number;
    name: string;
  };
  old_role: any;
  new_role: {
    id: number;
    name: string;
  } | null;
}

interface MyApproval {
  approval_id: number;
  level: number;
  approval_status: string;
  id: number;
  request_code: string;
  type: string;
  status: string;
  created_at: string;
  application_id: number;
  application_name: string;
  new_role_name: string | null;
}



export default function DashboardPage() {
  const [prevLoginAt, setPrevLoginAt] = React.useState<string | null>(null);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [markingId, setMarkingId] = React.useState<number | null>(null);
  const [myRequests, setMyRequests] = React.useState<MyRequest[]>([]);
  const [myApprovals, setMyApprovals] = React.useState<MyApproval[]>([]);


  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [reqRes, apprRes] = await Promise.all([
          apiAxios.get("/requests/me"),
          apiAxios.get("/requests/approvals/me"),
        ]);

        setMyRequests(reqRes.data.data || []);
        setMyApprovals(apprRes.data.data || []);

      } catch (err) {
        console.error("Dashboard load error:", err);
        setMyRequests([]);
        setMyApprovals([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiAxios.get("/application-users");
        const apps =
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              [];

        setApplications(apps);
      } catch (err) {
        console.error(err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiAxios.get("/auth/me");

        const prev_login_at = res.data.user?.prev_login_at;

        setPrevLoginAt(prev_login_at);
      } catch (err) {
        console.error(err);
        setPrevLoginAt(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const res = await apiAxios.get("/notifications/me");

        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);


  const normalizeUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const markAsRead = async (id: number) => {
    await apiAxios.patch(`/notifications/${id}/read`);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => n.is_read === 0);

    // Optimistic UI
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: 1 }))
    );

    try {
      await Promise.all(
        unread.map((n) =>
          apiAxios.patch(`/notifications/${n.id}/read`)
        )
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
      // Optional: refetch kalau mau super strict
    }
  };

  const accessibleApplications = React.useMemo(
    () => applications.filter((app) => app.has_access),
    [applications]
  );

  const accessibleCount = accessibleApplications.length;

  const myPendingRequests = myRequests.filter(
    (r) => r.status === "pending"
  ).length;

  const myPendingApprovals = myApprovals.filter(
    (a) => a.approval_status === "pending"
  ).length;

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



  return (
    <main className="min-h-screen bg-background p-6">

      <h1 className="text-3xl font-semibold text-foreground mb-2">
        Dashboard
      </h1>
      <p className="text-muted-foreground text-sm">
        Overview of request status, approvals, and system activity
      </p>
      <div className="min-h-8"></div>
      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Applications */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Accessable Application</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : accessibleCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>
                    Applications
                  </span>
                </p>

              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Pending Approval */}
        <Link href="/approvals" className="block">
          <Card
            className="
                border-border/40 
                hover:border-border 
                hover:shadow-sm 
                transition-all
                cursor-pointer
                focus-within:ring-2 
                focus-within:ring-primary
                group
              "
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    My Pending Approval
                  </p>

                  <h3 className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-16" /> : myPendingApprovals}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>Approvals</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>

                  {/* Visual hint kalau ini navigasi */}
                  <ChevronRight
                    className="
                        h-5 w-5 
                        text-muted-foreground
                        opacity-0 
                        -translate-x-1
                        group-hover:opacity-100 
                        group-hover:translate-x-0
                        transition-all
                      "
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* My Pending Requests */}
        <Link href="/requests" className="block">
          <Card
            className="
                border-border/40 
                hover:border-border 
                hover:shadow-sm 
                transition-all
                cursor-pointer
                focus-within:ring-2 
                focus-within:ring-primary
                group
              "
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    My On Going Requests
                  </p>

                  <h3 className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-16" /> : myPendingRequests}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>Requests</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>

                  <ChevronRight
                    className="
                      h-5 w-5 
                      text-muted-foreground
                      opacity-0 
                      -translate-x-1
                      group-hover:opacity-100 
                      group-hover:translate-x-0
                      transition-all
                    "
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Last Activity */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Last Activity</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    timeAgo(prevLoginAt)
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>
                    {loading
                      ? "..."
                      : prevLoginAt
                        ? "Previous login"
                        : "No previous activity"}
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-6">
        {/* NOTIFICATIONS */}
        <Card className="flex flex-col border-border/40">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                  <CardDescription className="text-xs">Latest updates</CardDescription>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={markAllAsRead}>Mark all as read</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Clear all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-1.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border border-border/40 p-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    group rounded-lg border border-border/40 transition-all duration-200 p-3 cursor-pointer
                    hover:border-border hover:bg-accent/50
                    ${notification.is_read === 0 ? "bg-accent/30" : "opacity-70"}
                  `}
                  onClick={async () => {
                    if (markingId === notification.id) return; // prevent double click

                    setMarkingId(notification.id);

                    // Optimistic UI
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === notification.id
                          ? { ...n, is_read: 1 }
                          : n
                      )
                    );

                    try {
                      await markAsRead(notification.id);
                    } catch (err) {
                      console.error("Failed to mark as read", err);
                      // Optional: revert UI kalau mau super strict
                    } finally {
                      setMarkingId(null);
                    }

                    // Redirect
                    if (notification.url) {
                      window.location.href = normalizeUrl(notification.url);
                    }
                  }}


                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {notification.app_code}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          className={`text-sm truncate ${notification.is_read === 0
                            ? "font-semibold text-foreground"
                            : "font-normal text-muted-foreground"
                            }`}
                        >
                          {notification.app_code}
                        </p>

                        {notification.is_read === 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>

                      <p
                        className={`text-xs line-clamp-2 mb-2 ${notification.is_read === 0
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70"
                          }`}
                      >
                        {notification.content}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(notification.notification_date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* APPLICATIONS */}
        <Card className="flex-1 border-border/40">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Applications</CardTitle>
                  <CardDescription className="text-xs">Access your available applications</CardDescription>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem>Sort by name</DropdownMenuItem>
                  <DropdownMenuItem>Sort by date</DropdownMenuItem>
                  <DropdownMenuItem>View all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border border-border/40 p-4">
                    <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))
              ) : applications.length > 0 ? (
                applications.map((app) => {
                  const Icon = (Icons as unknown as Record<string, LucideIcon>)[
                    app.icon?.charAt(0).toUpperCase() + app.icon?.slice(1)
                  ];

                  return (
                    <div
                      key={app.id}
                      className={`rounded-lg border border-border/40 transition p-4 bg-card
                        ${!app.has_access ? "opacity-60 grayscale cursor-not-allowed" : "hover:border-border hover:shadow-lg"}
                      `}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: app.color }}
                        >
                          {Icon ? (
                            <Icon className="h-6 w-6 text-white" />
                          ) : (
                            <span className="text-white font-semibold">
                              {app.code}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {app.code}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.name}
                          </p>
                          {app.role ? (
                            <span className="text-xs text-muted-foreground">
                              Role: {app.role.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              <div className="min-h-4"></div>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full h-9 text-xs"
                        variant={app.has_access ? "default" : "outline"}
                        disabled={!app.has_access}
                        onClick={() => {
                          if (app.has_access) {
                            window.open(app.url, "_blank");
                          }
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          {app.has_access ? (
                            <>
                              <span>Open Application</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              <span>No Access</span>
                            </>
                          )}
                        </span>
                      </Button>

                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">No applications available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}