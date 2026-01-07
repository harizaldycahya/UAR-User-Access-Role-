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
  Bell, CheckCircle2, Lock, Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface Application {
  id: number;
  is_accessible: boolean;
  owner: string;
  code: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

interface Notification {
  id: string;
  application: string;
  title: string;
  description: string;
  date: string;
  active: string;
}

export default function DashboardPage() {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, []);


  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/applications");
        if (!res.ok) throw new Error("Failed fetch");

        const data = await res.json();
        console.log(data);
        setApplications(data.data);
      } catch (err) {
        console.error(err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="min-h-screen bg-background p-6">
      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Applications */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Applications</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : applications.length}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : applications.filter(app => app.is_accessible).length} accessible
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

        {/* Active Notifications */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Active Notifications</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : notifications.filter(n => n.active === "true").length}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Bell className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : notifications.length} total updates
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Access */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pending Access</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : applications.filter(app => !app.is_accessible).length}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span>Awaiting approval</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card className="border-border/40 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Last Activity</p>
                <h3 className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16" /> : 'Today'}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>
                    {loading ? '...' : notifications.length > 0 ? notifications[0].date : 'No activity'}
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
                  <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Clear all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-1.5">
            {loading ? (
              // Skeleton placeholder
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
                  className="group rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 transition-all duration-200 p-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {notification.application}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        {notification.active === "true" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{notification.date}</span>
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
                // Skeleton placeholder
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border border-border/40 p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))
              ) : applications && applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="group rounded-lg border border-border/40 hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 p-4 bg-card"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {/* Icon container */}
                      <div
                        className="relative h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{
                          backgroundColor: app.color,
                          opacity: 0.9
                        }}
                      >
                        {app.icon ? (
                          <div
                            className="w-6 h-6 text-white"
                            dangerouslySetInnerHTML={{ __html: app.icon }}
                          />
                        ) : (
                          <span className="text-white font-semibold text-base">{app.code}</span>
                        )}

                        {/* Status badge */}
                        {app.is_accessible && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {/* App info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate mb-1">
                          {app.code} 
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.name}
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    <Button
                      className="w-full h-9 text-xs font-medium"
                      variant={app.is_accessible ? "default" : "outline"}
                      size="sm"
                      disabled={!app.is_accessible}
                      onClick={() => {
                        if (app.is_accessible && app.url) {
                          window.open(app.url, '_blank');
                        }
                      }}
                    >
                      {app.is_accessible ? (
                        <span className="flex items-center gap-1.5">
                          <span>Open Application</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Request Access</span>
                        </span>
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
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