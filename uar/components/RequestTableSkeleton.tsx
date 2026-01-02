"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestTableSkeleton() {

  return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </CardHeader>

        <CardContent>
          {/* FILTER SKELETON */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>

          {/* TABLE SKELETON */}
          <div className="overflow-x-auto rounded-lg border">
            <div className="min-w-225">
              {/* Header */}
              <div className="grid grid-cols-5 border-b bg-muted">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 m-2"
                  />
                ))}
              </div>

              {/* Rows */}
              {Array.from({ length: 5 }).map((_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-5 border-b"
                >
                  {Array.from({ length: 5 }).map((_, col) => (
                    <Skeleton
                      key={col}
                      className="h-10 m-2"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

  );
}
