// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userRaw = params.get("user");
    const error = params.get("error");

    if (error || !token || !userRaw) {
      router.push("/login?error=unauthorized");
      return;
    }

    const user = JSON.parse(decodeURIComponent(userRaw));

    // Simpan persis seperti login biasa
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    const roleRedirectMap: Record<string, string> = {
      admin: "/applications",
      hrd: "/approvals",
    };

    const redirectTo = roleRedirectMap[user.role_name] || "/dashboard";
    router.push(redirectTo);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        Authenticating...
      </div>
    </div>
  );
}