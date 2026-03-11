"use client";

import { useState, useEffect, Suspense } from "react";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";

type Step = "form" | "success" | "invalid";

// ─── Komponen utama dibungkus Suspense ────────────────────────
// Wajib di Next.js 13+ karena useSearchParams() butuh Suspense boundary

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [step, setStep] = useState<Step>("form");

    useEffect(() => {
        if (!token) {
            console.log("DEBUG: token kosong");
            setStep("invalid");
            setIsVerifying(false);
            return;
        }

        const verifyToken = async () => {
            try {
                console.log("DEBUG: fetch ke", `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-reset-token?token=${token}`);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-reset-token?token=${token}`
                );
                console.log("DEBUG: response status", res.status);
                const data = await res.json();
                console.log("DEBUG: response data", data);
                if (!res.ok) setStep("invalid");
            } catch (err) {
                console.log("DEBUG: fetch error", err);
                setStep("invalid");
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const getPasswordStrength = (pwd: string) => {
        if (pwd.length === 0) return null;
        if (pwd.length < 6) return { label: "Too short", color: "bg-red-500", width: "w-1/4" };
        if (pwd.length < 8) return { label: "Weak", color: "bg-orange-500", width: "w-2/4" };
        if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))
            return { label: "Fair", color: "bg-yellow-500", width: "w-3/4" };
        return { label: "Strong", color: "bg-green-500", width: "w-full" };
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async () => {
        setError("");

        if (password.length < 8) {
            setError("Password minimal 8 karakter.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        setIsLoading(true);

        try {
            console.log("DEBUG: fetch reset password...");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            console.log("DEBUG: status", res.status);
            const data = await res.json();
            console.log("DEBUG: response", data); // ← ini yang paling penting

            if (!res.ok) throw new Error(data.message || "Gagal reset password.");

            setStep("success");
        } catch (err: any) {
            console.log("DEBUG: error", err);
            setError(err.message || "Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
            {/* Sidebar */}
            <div className="hidden lg:flex lg:w-2/5 bg-gray-900 dark:bg-black flex-col justify-between p-12 border-r border-gray-800 dark:border-gray-900">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-xl font-semibold tracking-tight">Portal Triasmitra</h1>
                            <p className="text-gray-400 text-xs">Internal Employee Access</p>
                        </div>
                    </div>
                    <div className="mt-16 space-y-6">
                        <h2 className="text-white text-3xl font-bold leading-tight">
                            Create New<br />Password
                        </h2>
                        <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed max-w-md">
                            Buat password baru yang kuat untuk mengamankan akunmu.
                        </p>
                    </div>
                    <div className="mt-16 space-y-4">
                        {[
                            "Minimal 8 karakter",
                            "Gunakan huruf besar & kecil",
                            "Tambahkan angka atau simbol",
                            "Jangan gunakan password lama",
                        ].map((tip, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-gray-400 text-sm">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="text-gray-500 dark:text-gray-600 text-xs">
                    © {new Date().getFullYear()} PT Ketrosden Triasmitra. All rights reserved.
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Enterprise Portal</h1>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-8">
                        {isVerifying ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Memverifikasi link...</p>
                            </div>
                        ) : step === "invalid" ? (
                            <div className="text-center py-4">
                                <div className="flex justify-center mb-4">
                                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 flex items-center justify-center rounded-full">
                                        <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Invalid</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Reset link sudah kadaluarsa atau tidak valid. Silakan request ulang.
                                </p>
                                <a
                                    href="/forgot-password"
                                    className="inline-block w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm text-center leading-11"
                                >
                                    Request New Link
                                </a>
                            </div>
                        ) : step === "success" ? (
                            <div className="text-center py-4">
                                <div className="flex justify-center mb-4">
                                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 flex items-center justify-center rounded-full">
                                        <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Updated!</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Password kamu berhasil diperbarui. Silakan login kembali.
                                </p>
                                <a
                                    href="/login"
                                    className="inline-block w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm text-center leading-11"
                                >
                                    Back to Sign In
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Masukkan password baru kamu di bawah ini.
                                    </p>
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="mb-6 border-l-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="ml-2">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Masukkan password baru"
                                                className="pl-10 pr-10 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:border-blue-600 dark:focus:border-blue-500"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {strength && (
                                            <div className="space-y-1 pt-1">
                                                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Strength:{" "}
                                                    <span className={`font-medium ${strength.label === "Strong" ? "text-green-600 dark:text-green-400" :
                                                            strength.label === "Fair" ? "text-yellow-600 dark:text-yellow-400" :
                                                                "text-red-600 dark:text-red-400"
                                                        }`}>
                                                        {strength.label}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                            <Input
                                                id="confirm"
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="Ulangi password baru"
                                                className={`pl-10 pr-10 h-11 dark:bg-gray-800 focus:border-blue-600 dark:focus:border-blue-500 ${confirmPassword && confirmPassword !== password
                                                        ? "border-red-400 dark:border-red-500"
                                                        : "border-gray-300 dark:border-gray-700"
                                                    }`}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && confirmPassword !== password && (
                                            <p className="text-xs text-red-500">Password tidak cocok.</p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading || !password || !confirmPassword}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Updating...
                                            </div>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <a
                            href="/login"
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                        >
                            ← Back to Sign In
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Export default dengan Suspense wrapper ───────────────────
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}