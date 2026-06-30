"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type InsightLayout = "icon-row" | "icon-stacked" | "plain";
type InsightVariant = "surface" | "gradient";

interface InsightCardProps {
  label: string;
  value: ReactNode;
  loading?: boolean;
  layout?: InsightLayout;
  variant?: InsightVariant;
  gradient?: string;
  icon?: ReactNode;
  subLabel?: ReactNode;
  subIcon?: ReactNode;
  valueColorClassName?: string;
  skeletonWidthClassName?: string;
  href?: string;
  onClick?: () => void;
}

export function InsightCard({
  label,
  value,
  loading = false,
  layout = "plain",
  variant = "surface",
  gradient,
  icon,
  subLabel,
  subIcon,
  valueColorClassName = "",
  skeletonWidthClassName = "w-16",
  href,
  onClick,
}: InsightCardProps) {
  const isGradient = variant === "gradient";
  const isInteractive = Boolean(href || onClick);
  const showDecorativeBlob = isGradient && layout === "icon-stacked";

  const body = (
    <>
      {layout === "icon-row" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            {icon && (
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isGradient ? "" : "bg-primary/10 text-primary"
                  }`}
                style={isGradient ? { background: "rgba(255,255,255,0.18)" } : undefined}
              >
                {icon}
              </div>
            )}
            <p
              className={`flex-1 ${isGradient ? "text-sm text-white/80" : "text-sm text-muted-foreground"
                }`}
            >
              {label}
            </p>
            {href && (
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
            )}
          </div>
          <h3
            className={`text-2xl font-bold tracking-tight ${isGradient ? "text-white" : `text-foreground ${valueColorClassName}`
              }`}
          >
            {loading ? (
              <Skeleton
                className={`h-9 ${skeletonWidthClassName} ${isGradient ? "bg-white/20" : ""}`}
              />
            ) : (
              value
            )}
          </h3>
          {subLabel && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${isGradient ? "" : "text-muted-foreground"
                }`}
              style={isGradient ? { color: "rgba(255,255,255,0.7)" } : undefined}
            >
              {subIcon}
              <span>{subLabel}</span>
            </p>
          )}
        </>
      )}

      {layout === "icon-stacked" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={
                  isGradient
                    ? { background: "rgba(255,255,255,0.18)" }
                    : { background: gradient }
                }
              >
                {icon}
              </div>
            )}
            <p
              className={`text-sm font-medium ${isGradient ? "text-white" : "text-muted-foreground"
                }`}
            >
              {label}
            </p>
          </div>
          <div>
            <h3
              className={`text-3xl font-bold tracking-tight ${isGradient ? "text-white" : "text-foreground"
                }`}
            >
              {loading ? <Skeleton className="h-10 w-24 bg-white/20" /> : value}
            </h3>
            {subLabel && (
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${isGradient ? "" : "text-muted-foreground"
                  }`}
                style={isGradient ? { color: "rgba(255,255,255,0.7)" } : undefined}
              >
                {subIcon}
                <span>{loading ? "..." : subLabel}</span>
              </p>
            )}
          </div>
        </>
      )}

      {layout === "plain" && (
        <>
          <p
            className={`text-xs font-medium mb-1 ${isGradient ? "text-white/80" : "text-muted-foreground"
              }`}
          >
            {label}
          </p>
          <h3
            className={`text-xl font-bold ${isGradient ? "text-white" : valueColorClassName}`}
          >
            {loading ? (
              <Skeleton
                className={`h-8 ${skeletonWidthClassName} ${isGradient ? "bg-white/20" : ""}`}
              />
            ) : (
              value
            )}
          </h3>
          {subLabel && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${isGradient ? "" : "text-muted-foreground"
                }`}
              style={isGradient ? { color: "rgba(255,255,255,0.7)" } : undefined}
            >
              {subIcon}
              <span>{subLabel}</span>
            </p>
          )}
        </>
      )}
    </>
  );

  const content = (
    <Card
      onClick={onClick}
      style={isGradient ? { background: gradient } : undefined}
      className={`relative overflow-hidden transition-colors ${isGradient ? "border-transparent" : "border-border/40 hover:border-border"
        } ${href ? "hover:shadow-sm transition-all" : ""} ${isInteractive ? "cursor-pointer" : ""
        }`}
    >
      {showDecorativeBlob && (
        <>
          <div
            className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div
            className="absolute -bottom-14 -right-12 h-32 w-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </>
      )}
      <CardContent className="p-5 relative">{body}</CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}