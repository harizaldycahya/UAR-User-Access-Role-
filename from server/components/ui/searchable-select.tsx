"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  clearable?: boolean;
  clearLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options available",
  disabled = false,
  className = "",
  triggerClassName = "",
  clearable = false,
  clearLabel = "— Clear selection —",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (val: string) => {
      onValueChange?.(val);
      setOpen(false);
      setQuery("");
    },
    [onValueChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`
          w-full flex items-center justify-between gap-2
          border border-border rounded-md bg-background
          px-4 py-3 text-sm text-left
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-muted-foreground/50
          ${open ? "border-primary ring-2 ring-ring ring-offset-1" : ""}
          ${triggerClassName}
        `}
      >
        <span
          className={`flex-1 truncate ${
            !selectedOption ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs text-muted-foreground">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute z-50 mt-1 w-full
            bg-popover border border-border rounded-md shadow-lg
            overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-100
          "
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/60 border border-border/60 focus-within:border-primary/50 focus-within:bg-background transition-all">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    setQuery("");
                  }
                  if (e.key === "Enter" && filtered.length === 1) {
                    handleSelect(filtered[0].value);
                  }
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1"
          >
            {loading && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  {loadingText}
                </div>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {query ? `No results for "${query}"` : emptyText}
              </div>
            )}

            {!loading &&
              clearable &&
              !query &&
              value && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground italic hover:bg-muted transition-colors text-left"
                >
                  {clearLabel}
                </button>
              )}

            {!loading &&
              filtered.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center justify-between gap-2 px-3 py-2 text-sm
                      hover:bg-accent hover:text-accent-foreground
                      transition-colors text-left
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isSelected ? "bg-primary/10 text-primary" : "text-popover-foreground"}
                    `}
                  >
                    <span className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}