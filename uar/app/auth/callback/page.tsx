// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    const error = params.get("error");

    // Bersihkan URL dari query params
    window.history.replaceState({}, "", window.location.pathname);

    if (error || !role) {
      router.push("/login?error=unauthorized");
      return;
    }

    // ✅ Cookie sudah diset backend — tidak perlu exchange apapun
    // Langsung redirect berdasarkan role yang ada di URL
    const roleRedirectMap: Record<string, string> = {
      admin: "/applications",
      hrd: "/approvals",
    };

    const redirectTo = roleRedirectMap[role] || "/dashboard";
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