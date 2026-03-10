"use client";

import { useState } from "react";
import { Lock, User, AlertCircle, ArrowLeft, CheckCircle2, Layers, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "input" | "sent";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState(""); // ← ganti dari email ke username
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [sentToEmail, setSentToEmail] = useState("");

  const handleSubmit = async () => {
    if (!username) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("https://devapiuar.triasmitra.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }), // ← kirim username, bukan email
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim permintaan.");
      }

      setSentToEmail(data.email ?? "");
      setStep("sent");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && username) handleSubmit();
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
              Reset Your<br />Password
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed max-w-md">
              Masukkan username kamu. Kami akan mengirimkan link reset ke email
              yang terdaftar di sistem HR Triasmitra.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600/20 text-blue-500 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Centralized System Access</div>
                <div className="text-gray-500 text-xs mt-1">One portal to access internal applications and platforms.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600/20 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Secure Authentication</div>
                <div className="text-gray-500 text-xs mt-1">Protected access aligned with company security policies.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600/20 text-blue-500 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Operational Efficiency</div>
                <div className="text-gray-500 text-xs mt-1">Designed to support daily tasks and enterprise workflows.</div>
              </div>
            </div>
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
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Enterprise Portal</h1>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-8">
            {step === "input" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Forgot Password
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Masukkan username kamu untuk menerima link reset password.
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
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Masukkan username kamu"
                        className="pl-10 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:border-blue-600 dark:focus:border-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Link reset akan dikirim ke email yang terdaftar di sistem HR.
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !username}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengirim...
                      </div>
                    ) : (
                      "Kirim Link Reset"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 flex items-center justify-center rounded-full">
                    <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Permintaan Dikirim!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Jika username <span className="font-semibold text-gray-800 dark:text-gray-200">{username}</span> terdaftar,
                  link reset password akan dikirim ke email kamu :
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-6">
                  {sentToEmail}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Tidak menerima email?{" "}
                  <button
                    onClick={() => { setStep("input"); setError(""); }}
                    className="text-blue-600 dark:text-blue-500 hover:underline font-medium"
                  >
                    Coba lagi
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}