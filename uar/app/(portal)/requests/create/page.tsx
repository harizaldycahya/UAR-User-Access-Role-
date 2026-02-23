"use client";

import React from "react";
import Swal from "sweetalert2";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";


type RequestType = "application_access" | "change_role" | "";

const steps = [
  { id: 1, title: "Request Type", icon: FileText },
  { id: 2, title: "Application", icon: Settings },
  { id: 3, title: "Details", icon: FileText },
  { id: 4, title: "Review", icon: CheckCircle2 },
];


interface Application {
  id: number;
  code: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  has_access: boolean;
  granted_at: string | null;
  role: {
    id: number;
    name: string;
  } | null;
}

interface ApplicationRole {
  id: string;
  application_id?: number;
  name: string;
  description?: string;
}

export default function CreateRequestsPage() {

  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const [applications, setApplications] = React.useState<Application[]>([]);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    requestType: "" as RequestType,
    application: "",
    role: "",
    oldRole: "",
    newRole: "",
    justification: "",
  });


  const canProceed = () => {
    if (step === 1) return form.requestType !== "";
    if (step === 2) return form.application !== "";
    if (step === 3) {
      if (form.requestType === "application_access") {
        return (
          form.role !== "" &&
          form.justification.trim() !== ""
        );
      }
      return form.oldRole !== "" && form.newRole !== "" && form.justification.trim() !== "";
    }
    return true;
  };

  // auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, []);

  // load applications
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/application-users");
        setApplications(Array.isArray(res) ? res : []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // load roles by application
  useEffect(() => {
    if (!form.application) {
      setRoles([]);
      return;
    }

    const loadRoles = async () => {
      try {
        setLoadingRoles(true);

        const selectedApp = applications.find(
          (a) => String(a.id) === String(form.application)
        );

        if (!selectedApp) return;

        let res;

        // khusus IMS & AMS
        if (selectedApp.code === "IMS") {
          res = await apiFetch("/applications/integrations/ims/roles");
          setRoles(res?.data?.result?.data ?? []);
        }
        else if (selectedApp.code === "AMS") {
          res = await apiFetch("/applications/integrations/ams/roles");
          setRoles(res?.data?.result?.data ?? []);
        }
        else {
          res = await apiFetch(`/applications/${form.application}/roles`);
          setRoles(res?.data ?? []);
        }

      } catch (err) {
        console.error(err);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, [form.application, applications]);

  useEffect(() => {
    if (!form.application) return;


    if (!app || !app.has_access) return;

    const role = app.role;
    if (!role) return;

    setForm((prev) => ({
      ...prev,
      oldRole: String(role.id),
    }));
  }, [form.application, applications]);

  const availableApps = applications.filter((app) => !app.has_access);
  const ownedApps = applications.filter((app) => app.has_access);

  const [roles, setRoles] = useState<ApplicationRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const app = applications.find(
    (a) => String(a.id) === String(form.application)
  );

  const getRoleName = (roleId?: string) => {
    if (!roleId) return "-";
    return roles.find((r) => String(r.id) === roleId)?.name ?? "-";
  };


  const submitRequest = async () => {
    try {
      const selectedNewRoleId =
        form.requestType === "application_access"
          ? form.role
          : form.newRole;

      const selectedNewRole = roles.find(
        (r) => String(r.id) === String(selectedNewRoleId)
      );

      const selectedOldRole =
        form.requestType === "change_role"
          ? app?.role
          : null;

      const res = await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          application_id: form.application,
          type: form.requestType,

          old_role_id:
            form.requestType === "change_role"
              ? form.oldRole
              : null,

          old_role_name:
            form.requestType === "change_role"
              ? selectedOldRole?.name || null
              : null,

          new_role_id: selectedNewRoleId,
          new_role_name: selectedNewRole?.name || null,

          justification: form.justification,
        }),
      });

      if (res?.success === false) {
        throw new Error(res?.message || "Request failed");
      }

      await Swal.fire({
        icon: "success",
        title: "Request submitted",
        text: "Your request has been sent for approval.",
        confirmButtonText: "OK",
      });

      router.push("/requests");

    } catch (err: any) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err?.message || "Failed to submit request",
      });

      router.push("/requests");
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Create Request
          </h1>
          <p className="text-muted-foreground text-sm">
            Submit your application access or role change request
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium transition-colors whitespace-nowrap ${isActive || isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                          }`}
                      >
                        {s.title}
                      </p>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 transition-colors duration-300 self-start mt-5 ${step > s.id
                        ? "bg-primary"
                        : "bg-border"
                        }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-foreground text-lg font-medium">
              {steps[step - 1].title}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {step === 1 && "Choose the type of request you want to make"}
              {step === 2 && "Select the application you need access to"}
              {step === 3 && "Provide the necessary details for your request"}
              {step === 4 && "Review your request before submitting"}
            </p>
          </CardHeader>

          <CardContent className="p-8 min-h-80">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-3">
                <RadioGroup
                  value={form.requestType}
                  onValueChange={(value) =>
                    setForm({ ...form, requestType: value as RequestType })
                  }
                  className="space-y-3"
                >
                  <div
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        requestType: "application_access",
                      }))
                    }
                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all ${form.requestType === "application_access"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                  >
                    <RadioGroupItem
                      value="application_access"
                      id="access"
                      checked={form.requestType === "application_access"}
                    />
                    <Label htmlFor="access" className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">
                        Request Application Access
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Request access to a new application
                      </div>
                    </Label>
                  </div>


                  <div
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        requestType: "change_role",
                      }))
                    }
                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all
                        ${form.requestType === "change_role"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                  >
                    <RadioGroupItem
                      value="change_role"
                      id="change"
                      checked={form.requestType === "change_role"}
                    />
                    <Label htmlFor="change" className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">Change Role</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Request to change your current role
                      </div>
                    </Label>
                  </div>

                </RadioGroup>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm mb-3 block">
                    Select Application
                  </Label>

                  <Select
                    value={form.application}
                    onValueChange={(value) =>
                      setForm({ ...form, application: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-background border-border text-foreground px-5 py-8">
                      <SelectValue placeholder="Choose application" />
                    </SelectTrigger>

                    <SelectContent className="bg-popover border-border">
                      {(form.requestType === "application_access"
                        ? availableApps
                        : ownedApps
                      ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Tidak ada aplikasi tersedia
                          </div>
                        )}

                      {(form.requestType === "application_access"
                        ? availableApps
                        : ownedApps
                      ).map((app) => (
                        <SelectItem
                          key={app.id}
                          value={String(app.id)}
                          className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex flex-col items-start py-1">
                            <span className="font-medium">{app.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {app.code.toUpperCase()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div>
                {form.requestType === "application_access" && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm mb-3 block">Requested Role</Label>
                      <Select
                        value={form.role}
                        onValueChange={(value) =>
                          setForm({ ...form, role: value })
                        }
                      >
                        <SelectTrigger className="w-full px-5 py-8">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>

                        <SelectContent className="max-h-60 overflow-y-auto">
                          {loadingRoles && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Loading roles...
                            </div>
                          )}

                          {!loadingRoles && roles.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No roles available
                            </div>
                          )}

                          {roles.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium text-left">{role.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm mb-3 block">Justification</Label>
                      <Textarea
                        placeholder="Explain why you need access to this application..." className="p-5"
                        value={form.justification}
                        onChange={(e) =>
                          setForm({ ...form, justification: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}


                {form.requestType === "change_role" && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm mb-3 block">Current Role</Label>
                      <Input
                        value={app?.role?.name ?? "-"}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>


                    <div>
                      <Label className="text-sm mb-3 block">New Role</Label>
                      <Select
                        value={form.newRole}
                        onValueChange={(value) =>
                          setForm({ ...form, newRole: value })
                        }
                      >
                        <SelectTrigger className="w-full h-12">
                          <SelectValue placeholder="Select new role" />
                        </SelectTrigger>

                        <SelectContent>
                          {roles
                            .filter((r) => String(r.id) !== String(form.oldRole))
                            .map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-foreground text-sm mb-3 block">Justification</Label>
                      <Textarea
                        placeholder="Please provide a detailed explanation for this role change request..."
                        value={form.justification}
                        onChange={(e) =>
                          setForm({ ...form, justification: e.target.value })
                        }
                        className="w-full min-h-30 resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-foreground text-base">Request Summary</h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-32 text-sm text-muted-foreground">Request Type</div>
                      <div className="flex-1 text-sm text-foreground">
                        {form.requestType === "application_access"
                          ? "Application Access"
                          : "Role Change"}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-32 text-sm text-muted-foreground">Application</div>
                      <div className="flex-1 text-sm text-foreground">
                        {app?.name ?? "-"}
                      </div>
                    </div>

                    {form.requestType === "application_access" ? (
                      <>
                        <div className="flex items-start">
                          <div className="w-32 text-sm text-muted-foreground">Requested Role</div>
                          <div className="flex-1 text-sm text-foreground">
                            {getRoleName(form.role)}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-32 text-sm text-muted-foreground">Justification</div>
                          <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                            {form.justification}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start">
                          <div className="w-32 text-sm text-muted-foreground">Current Role</div>
                          <div className="flex-1 text-sm text-foreground">
                            {app?.role?.name ?? "-"}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-32 text-sm text-muted-foreground">New Role</div>
                          <div className="flex-1 text-sm text-foreground">
                            {getRoleName(form.newRole)}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-32 text-sm text-muted-foreground">Justification</div>
                          <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                            {form.justification}
                          </div>
                        </div>
                      </>

                    )}
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-sm text-primary">
                    Your request will be sent to the appropriate approvers. You will receive a notification once it has been reviewed.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <div className="border-t border-border px-6 py-4 bg-muted/30">
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="min-w-25"
              >
                Back
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="min-w-25"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="min-w-25"
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitRequest}>
                    Submit Request
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}