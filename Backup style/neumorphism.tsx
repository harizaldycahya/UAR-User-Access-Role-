'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical, Calendar, ExternalLink, Bell, CheckCircle2 } from "lucide-react";
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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [notifRes, appRes] = await Promise.all([
          fetch("http://localhost:4000/notifications"),
          fetch("http://localhost:4000/applications"),
        ]);

        const notifData = await notifRes.json();
        const appData = await appRes.json();

        // Biar skeleton kelihatan (opsional, tapi estetik)
        await new Promise((resolve) => setTimeout(resolve, 800));

        setNotifications(notifData);
        setApplications(appData);
      } catch (err) {
        console.error(err);
        setNotifications([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex gap-6">
        {/* NOTIFICATIONS - Neumorphism Style */}
        <div className="w-[30%] flex flex-col">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-slate-600" />
                  Notifications
                </h2>
                <p className="text-sm text-slate-500 mt-1">Latest updates and activity</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center justify-center text-slate-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Clear all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3">
              {loading ? (
                // Skeleton placeholder
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
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
                    className="group rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_6px_#d1d5db,inset_-2px_-2px_6px_#ffffff] transition-all duration-200 p-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-[4px_4px_8px_rgba(59,130,246,0.3),-2px_-2px_6px_rgba(147,197,253,0.5)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {notification.application}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{notification.description}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>{notification.date}</span>
                        </div>
                      </div>
                      {notification.active === "true" && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Calendar className="h-12 w-12 mb-4" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* APPLICATIONS - Neumorphism Style */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Applications</h2>
                <p className="text-sm text-slate-500 mt-1">Access your available applications</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center justify-center text-slate-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem>Sort by name</DropdownMenuItem>
                  <DropdownMenuItem>Sort by date</DropdownMenuItem>
                  <DropdownMenuItem>View all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                // Skeleton placeholder untuk aplikasi
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-6">
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-20 w-20 rounded-2xl mb-4" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                  </div>
                ))
              ) : applications && applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="group rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_24px_#d1d5db,-12px_-12px_24px_#ffffff] transition-all duration-300 p-6"
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Icon Container with Neumorphic Effect */}
                      <div 
                        className="relative h-20 w-20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(145deg, ${app.color}dd, ${app.color})`,
                          boxShadow: `6px 6px 12px ${app.color}40, -6px -6px 12px ${app.color}20, inset 2px 2px 4px rgba(255,255,255,0.1)`
                        }}
                      >
                        {app.icon ? (
                          <div
                            className="w-10 h-10 text-white drop-shadow-lg"
                            dangerouslySetInnerHTML={{ __html: app.icon }}
                          />
                        ) : (
                          <span className="text-white font-bold text-2xl drop-shadow-lg">{app.code}</span>
                        )}
                        
                        {/* Status indicator */}
                        {app.is_accessible && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-[2px_2px_6px_rgba(34,197,94,0.4),-2px_-2px_4px_rgba(134,239,172,0.3)] flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* App Info */}
                      <h3 className="font-semibold text-base text-slate-800 mb-1 px-2 truncate w-full">
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 truncate w-full px-2">
                        {app.owner}
                      </p>

                      {/* Action Button */}
                      <button
                        className={`w-full h-11 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          app.is_accessible
                            ? 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] active:shadow-[inset_6px_6px_12px_#d1d5db,inset_-6px_-6px_12px_#ffffff]'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] cursor-not-allowed'
                        }`}
                        disabled={!app.is_accessible}
                        onClick={() => {
                          if (app.is_accessible && app.url) {
                            window.open(app.url, '_blank');
                          }
                        }}
                      >
                        {app.is_accessible ? (
                          <>
                            <span>Open Application</span>
                            <ExternalLink className="h-4 w-4" />
                          </>
                        ) : (
                          "Request Access"
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                  <Calendar className="h-12 w-12 mb-4" />
                  <p className="text-sm">No applications available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}