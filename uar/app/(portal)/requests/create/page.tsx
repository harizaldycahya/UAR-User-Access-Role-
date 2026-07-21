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
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select"; // ← komponen baru


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
  role_mode: "static" | "dynamic";
  role: {
    id: number;
    name: string;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
}

interface ApplicationRole {
  id: string;
  application_id?: number;
  name: string;
  description?: string;
}

interface ApplicationLocation {
  id: string;
  name: string;
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
    notes: "",
    location: "",
    oldLocation: "",
    newLocation: "",
  });


  const canProceed = () => {
    if (step === 1) return form.requestType !== "";
    if (step === 2) return form.application !== "";
    if (step === 3) {
      if (form.requestType === "application_access") {
        if (app?.role_mode === "dynamic") {
          const baseValid = form.notes.trim() !== "" && form.justification.trim() !== "";
          if (isAms) return baseValid && form.location !== "";
          return baseValid;
        }
        const baseValid = form.role !== "" && form.justification.trim() !== "";
        if (isAms) return baseValid && form.location !== "";
        return baseValid;
      }

      // change_role
      if (app?.role_mode === "dynamic") {
        const baseValid = form.notes.trim() !== "" && form.justification.trim() !== "";
        return baseValid;
      }

      if (isAms) {
        const roleChanged = form.newRole !== "";
        const locationChanged = form.newLocation !== "";
        return (roleChanged || locationChanged) && form.justification.trim() !== "";
      }

      return form.newRole !== "" && form.justification.trim() !== "";
    }
  }

  const EXCLUDED_FROM_REQUEST = ["HRIS", "SHOCART", "HELPDESK"];

  // load applications
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/application-users");
        const apps = Array.isArray(res) ? res : [];
        const filtered = apps.filter(
          (a: Application) => !EXCLUDED_FROM_REQUEST.includes(a.code)
        );
        setApplications(filtered);
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

        if (selectedApp.code === "IMS") {
          res = await apiFetch("/applications/integrations/ims/roles");
          setRoles(res?.data?.result?.data ?? []);
        } else if (selectedApp.code === "AMS") {
          res = await apiFetch("/applications/integrations/ams/roles");
          setRoles(res?.data?.result?.data ?? []);
        } else if (selectedApp.code === "CMS") {
          res = await apiFetch("/applications/integrations/cms/roles");
          setRoles(res?.data?.result?.data ?? []);
        } else if (selectedApp.code === "QMS") {
          res = await apiFetch("/applications/integrations/qms/roles");
          setRoles(res?.data?.result?.data ?? []);
        } else if (selectedApp.code === "DMS") {
          res = await apiFetch("/applications/integrations/dms/roles");
        } else if (selectedApp.code === "SONAR") {
          res = await apiFetch("/applications/integrations/sonar/roles");
          const sonarRoles = res?.data?.result?.roles ?? [];
          setRoles(
            sonarRoles.map((r: { key: string; label: string }) => ({
              id: r.key,      // ← ini yang dipakai sebagai value/id (bukan label)
              name: r.label,  // ← dipakai untuk ditampilkan ke user
            }))
          );
        }else {
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

  // load locations for AMS
  useEffect(() => {
    if (!form.application) {
      setLocations([]);
      return;
    }

    const selectedApp = applications.find(
      (a) => String(a.id) === String(form.application)
    );

    if (selectedApp?.code !== "AMS") {
      setLocations([]);
      return;
    }

    const loadLocations = async () => {
      try {
        setLoadingLocations(true);
        const res = await apiFetch("/applications/integrations/ams/locations");
        setLocations(res?.data?.result?.data ?? []);
      } catch (err) {
        console.error(err);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, [form.application, applications]);

  useEffect(() => {
    if (!form.application) return;
    if (!app || !app.has_access) return;
    const role = app.role;
    if (!role) return;
    setForm((prev) => ({
      ...prev,
      oldRole: String(role.id),
      oldLocation: app.location ? String(app.location.id) : "",
    }));
  }, [form.application, applications]);

  const availableApps = applications.filter((app) => !app.has_access);
  const ownedApps = applications.filter((app) => app.has_access);

  const [roles, setRoles] = useState<ApplicationRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [locations, setLocations] = useState<ApplicationLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const app = applications.find(
    (a) => String(a.id) === String(form.application)
  );

  const isAms = app?.code === "AMS";

  const getRoleName = (roleId?: string) => {
    if (!roleId) return "-";
    return roles.find((r) => String(r.id) === roleId)?.name ?? "-";
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return "-";
    return locations.find((l) => String(l.id) === locationId)?.name ?? "-";
  };

  // ── helpers: convert to SearchableSelect options ──────────────────────────

  const appOptions = (form.requestType === "application_access" ? availableApps : ownedApps).map(
    (a) => ({ value: String(a.id), label: a.name, sublabel: a.code.toUpperCase() })
  );

  const roleOptions = roles.map((r) => ({ value: String(r.id), label: r.name }));

  const roleOptionsExcludingCurrent = roles
    .filter((r) => String(r.id) !== String(form.oldRole))
    .map((r) => ({ value: String(r.id), label: r.name }));

  const locationOptions = locations.map((l) => ({ value: String(l.id), label: l.name }));

  const locationOptionsExcludingCurrent = locations
    .filter((l) => String(l.id) !== String(form.oldLocation))
    .map((l) => ({ value: String(l.id), label: l.name }));

  // ─────────────────────────────────────────────────────────────────────────

  const submitRequest = async () => {
    try {
      const selectedNewRoleId =
        form.requestType === "application_access"
          ? form.role
          : form.newRole || null;

      const selectedNewRole = roles.find(
        (r) => String(r.id) === String(selectedNewRoleId)
      );

      const selectedOldRole =
        form.requestType === "change_role" ? app?.role : null;

      const newLocationId = isAms
        ? form.requestType === "application_access"
          ? form.location
          : form.newLocation
        : null;
      const newLocationName = isAms ? getLocationName(newLocationId ?? "") : null;
      const oldLocationId = isAms && form.requestType === "change_role" ? form.oldLocation : null;
      const oldLocationName =
        isAms && form.requestType === "change_role" ? (app?.location?.name ?? null) : null;

      const res = await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          application_id: form.application,
          type: form.requestType,
          old_role_id: form.requestType === "change_role" ? form.oldRole : null,
          old_role_name: form.requestType === "change_role" ? selectedOldRole?.name || null : null,
          new_role_id: app?.role_mode === "dynamic" ? null : selectedNewRoleId || null,
          new_role_name: app?.role_mode === "dynamic" ? null : selectedNewRole?.name || null,
          new_location_id: newLocationId,
          new_location_name: newLocationName,
          old_location_id: oldLocationId,
          old_location_name: oldLocationName,
          notes: app?.role_mode === "dynamic" ? form.notes : null,
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
    <main className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-semibold text-foreground mb-2">
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
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isCompleted || isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium transition-colors whitespace-nowrap ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                          }`}
                      >
                        <span className="hidden sm:inline">{s.title}</span>
                      </p>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 transition-colors duration-300 self-start mt-5 ${step > s.id ? "bg-primary" : "bg-border"
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

          <CardContent className="p-4 sm:p-8 min-h-80">
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
                      setForm((prev) => ({ ...prev, requestType: "application_access" }))
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
                      <div className="font-medium text-foreground">Request Application Access</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Request access to a new application
                      </div>
                    </Label>
                  </div>

                  <div
                    onClick={() =>
                      setForm((prev) => ({ ...prev, requestType: "change_role" }))
                    }
                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all ${form.requestType === "change_role"
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
                  <SearchableSelect
                    options={appOptions}
                    value={form.application}
                    onValueChange={(value) => setForm({ ...form, application: value })}
                    placeholder="Choose application"
                    searchPlaceholder="Search application..."
                    emptyText="No applications available"
                    triggerClassName="py-4"
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div>
                {form.requestType === "application_access" && (
                  <div className="space-y-5">
                    {app?.role_mode === "dynamic" ? (
                      <div>
                        <Label className="text-sm mb-3 block">Notes</Label>
                        <Textarea
                          placeholder="Describe the role or access level you need..."
                          className="p-5"
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm mb-3 block">Requested Role</Label>
                        <SearchableSelect
                          options={roleOptions}
                          value={form.role}
                          onValueChange={(value) => setForm({ ...form, role: value })}
                          placeholder="Select role"
                          searchPlaceholder="Search role..."
                          loading={loadingRoles}
                          emptyText="No roles available"
                          triggerClassName="py-4"
                        />
                      </div>
                    )}

                    {/* Location - AMS only */}
                    {isAms && (
                      <div>
                        <Label className="text-sm mb-3 block">Location</Label>
                        <SearchableSelect
                          options={locationOptions}
                          value={form.location}
                          onValueChange={(value) => setForm({ ...form, location: value })}
                          placeholder="Select location"
                          searchPlaceholder="Search location..."
                          loading={loadingLocations}
                          emptyText="No locations available"
                          triggerClassName="py-4"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm mb-3 block">Justification</Label>
                      <Textarea
                        placeholder="Explain why you need access to this application..."
                        className="p-5"
                        value={form.justification}
                        onChange={(e) => setForm({ ...form, justification: e.target.value })}
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

                    {app?.role_mode === "dynamic" ? (
                      <div>
                        <Label className="text-sm mb-3 block">Notes</Label>
                        <Textarea
                          placeholder="Describe the new role you are requesting..."
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm mb-3 block">
                          New Role
                          {isAms && (
                            <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                          )}
                        </Label>
                        <SearchableSelect
                          options={roleOptionsExcludingCurrent}
                          value={form.newRole}
                          onValueChange={(value) => setForm({ ...form, newRole: value })}
                          placeholder="Select new role"
                          searchPlaceholder="Search role..."
                          loading={loadingRoles}
                          emptyText="No roles available"
                          clearable={isAms}
                          clearLabel="— No change —"
                          triggerClassName="py-3"
                        />
                        {isAms && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty if you only want to change location
                          </p>
                        )}
                      </div>
                    )}

                    {/* Location - AMS only */}
                    {isAms && (
                      <>
                        <div>
                          <Label className="text-sm mb-3 block">Current Location</Label>
                          <Input
                            value={app?.location?.name ?? "-"}
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-sm mb-3 block">
                            New Location
                            <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                          </Label>
                          <SearchableSelect
                            options={locationOptionsExcludingCurrent}
                            value={form.newLocation}
                            onValueChange={(value) => setForm({ ...form, newLocation: value })}
                            placeholder="Select new location"
                            searchPlaceholder="Search location..."
                            loading={loadingLocations}
                            emptyText="No locations available"
                            clearable
                            clearLabel="— No change —"
                            triggerClassName="py-4"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty if you only want to change role
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <Label className="text-foreground text-sm mb-3 block">Justification</Label>
                      <Textarea
                        placeholder="Please provide a detailed explanation for this role change request..."
                        value={form.justification}
                        onChange={(e) => setForm({ ...form, justification: e.target.value })}
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
                    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                      <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Request Type</div>
                      <div className="flex-1 text-sm text-foreground">
                        {form.requestType === "application_access" ? "Application Access" : "Role Change"}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                      <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Application</div>
                      <div className="flex-1 text-sm text-foreground">{app?.name ?? "-"}</div>
                    </div>

                    {form.requestType === "application_access" ? (
                      <>
                        {app?.role_mode === "dynamic" ? (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                            <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Notes</div>
                            <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.notes}</div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                            <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Requested Role</div>
                            <div className="flex-1 text-sm text-foreground">{getRoleName(form.role)}</div>
                          </div>
                        )}
                        {isAms && (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                            <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Location</div>
                            <div className="flex-1 text-sm text-foreground">{getLocationName(form.location)}</div>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                          <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Justification</div>
                          <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.justification}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                          <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Current Role</div>
                          <div className="flex-1 text-sm text-foreground">{app?.role?.name ?? "-"}</div>
                        </div>
                        {app?.role_mode === "dynamic" ? (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                            <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Notes</div>
                            <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.notes}</div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                            <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">New Role</div>
                            <div className="flex-1 text-sm text-foreground">{getRoleName(form.newRole)}</div>
                          </div>
                        )}
                        {isAms && (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                              <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Current Location</div>
                              <div className="flex-1 text-sm text-foreground">{app?.location?.name ?? "-"}</div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                              <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">New Location</div>
                              <div className="flex-1 text-sm text-foreground">{getLocationName(form.newLocation)}</div>
                            </div>
                          </>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0">
                          <div className="sm:w-32 text-xs sm:text-sm text-muted-foreground shrink-0">Justification</div>
                          <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.justification}</div>
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
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="w-full sm:w-auto sm:min-w-25"
              >
                Back
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="w-full sm:w-auto sm:min-w-25"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto sm:min-w-25"
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitRequest} className="w-full sm:w-auto">
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