"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, AlertCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType = "approval" | "rejection";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  url: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: 0 | 1;
  read_at: string | null;
  notification_date: string;
}

interface ApiResponse {
  data: Notification[];
  unread_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  approval: <ThumbsUp className="h-4 w-4" />,
  rejection: <ThumbsDown className="h-4 w-4" />,
};

const colorMap: Record<NotificationType, string> = {
  approval: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  rejection: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // ── Fetch full data (dipanggil saat panel dibuka) ───────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ApiResponse = await apiFetch("/notifications/uar");
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch (err: any) {
      setError(err.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch unread count saja (ringan, untuk badge) ───────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res: ApiResponse = await apiFetch("/notifications/uar");
      setUnreadCount(res.unread_count);
    } catch {
      // silent fail
    }
  }, []);

  // Fetch badge saat pertama kali mount — supaya merah langsung muncul
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Polling badge setiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (open) {
        // Panel terbuka → refresh full data
        fetchNotifications();
      } else {
        // Panel tertutup → cukup update badge
        fetchUnreadCount();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [open, fetchNotifications, fetchUnreadCount]);

  // Fetch full data saat panel pertama kali dibuka
  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Mark single notification as read + navigate ─────────────────
  const markAsRead = async (notif: Notification) => {
    if (notif.is_read) {
      if (notif.url) window.location.href = notif.url;
      return;
    }

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 as const } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await apiFetch(`/notifications/uar/${notif.id}/read`, { method: "PATCH" });
      if (notif.url) window.location.href = notif.url;
    } catch {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: 0 as const } : n))
      );
      setUnreadCount((c) => c + 1);
    }
  };

  // ── Mark all as read ────────────────────────────────────────────
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 as const })));
    setUnreadCount(0);
    try {
      await apiFetch("/notifications/uar/read-all", { method: "PATCH" });
    } catch {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors",
          open
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-14 z-50 w-95 overflow-hidden rounded-2xl border bg-popover shadow-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-105 overflow-y-auto">

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <AlertCircle className="h-8 w-8 opacity-40 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-xs text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            )}

            {/* Items */}
            {!loading && !error && notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif)}
                className={cn(
                  "group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-accent",
                  !notif.is_read && "bg-primary/5"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    colorMap[notif.type]
                  )}
                >
                  {iconMap[notif.type]}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {notif.content}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {timeAgo(notif.notification_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="border-t px-4 py-2.5">
              <a
                href="/notifications"
                className="block text-center text-xs text-primary hover:underline"
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}