"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ⛔ cegah hydration error
  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-md border" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted">
          {theme === "dark" && <Moon className="h-5 w-5" />}
          {theme === "light" && <Sun className="h-5 w-5" />}
          {theme === "system" && <Monitor className="h-5 w-5" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 p-2">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-3 h-5 w-5" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-3 h-5 w-5" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-3 h-5 w-5" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
