"use client";

import { useState } from "react";
import { Lock, Mail, AlertCircle, ArrowLeft, CheckCircle2, Layers, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "input" | "sent";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");

  const handleSubmit = async () => {
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim email reset.");
      }

      setStep("sent");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && email) handleSubmit();
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Sidebar Branding — sama persis dengan LoginPage */}
      <div className="hidden lg:flex lg:w-2/5 bg-gray-900 dark:bg-black flex-col justify-between p-12 border-r border-gray-800 dark:border-gray-900">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-semibold tracking-tight">
                Portal Triasmitra
              </h1>
              <p className="text-gray-400 text-xs">Internal Employee Access</p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h2 className="text-white text-3xl font-bold leading-tight">
              Reset Your<br />Password
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed max-w-md">
              Enter your registered email address and we'll send you a secure link
              to reset your password.
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
          {/* Mobile Logo */}
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
                    Enter your email and we'll send a reset link.
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
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your registered email"
                        className="pl-10 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:border-blue-600 dark:focus:border-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !email}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
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
                  Check your email
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  We sent a password reset link to
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-6">
                  {email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Didn't receive it?{" "}
                  <button
                    onClick={() => { setStep("input"); setError(""); }}
                    className="text-blue-600 dark:text-blue-500 hover:underline font-medium"
                  >
                    Try again
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}