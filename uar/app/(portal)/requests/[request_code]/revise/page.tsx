"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, FileText, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

type RequestType = "application_access" | "change_role";

const steps = [
    { id: 1, title: "Request Type", icon: FileText },
    { id: 2, title: "Application", icon: Settings },
    { id: 3, title: "Details", icon: FileText },
    { id: 4, title: "Review", icon: CheckCircle2 },
];

interface ApplicationRole { id: string; name: string; }
interface ApplicationLocation { id: string; name: string; }

export default function ReviseRequestPage() {
    const router = useRouter();
    const { request_code } = useParams();

    const [step, setStep] = useState(3);
    const [pageLoading, setPageLoading] = useState(true);

    const [request, setRequest] = useState<any>(null);
    const [app, setApp] = useState<any>(null);

    const [roles, setRoles] = useState<ApplicationRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [locations, setLocations] = useState<ApplicationLocation[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const [form, setForm] = useState({
        newRole: "",
        newLocation: "",
        notes: "",
        justification: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch(`/requests/${request_code}`);
                const req = res.data;
                setRequest(req);

                // ✅ Langsung dari request detail, tidak perlu fetch /application-users
                setApp(req.application);

                setForm({
                    newRole: req.new_role_id ?? "",
                    newLocation: req.new_location_id ?? "",
                    notes: req.notes ?? "",
                    justification: req.justification ?? "",
                });

                if (req.application) {
                    setLoadingRoles(true);
                    let rolesRes;
                    const code = req.application.code;
                    if (code === "IMS") rolesRes = await apiFetch("/applications/integrations/ims/roles");
                    else if (code === "AMS") rolesRes = await apiFetch("/applications/integrations/ams/roles");
                    else if (code === "CMS") rolesRes = await apiFetch("/applications/integrations/cms/roles");
                    else rolesRes = await apiFetch(`/applications/${req.application.id}/roles`);

                    setRoles(
                        ["IMS", "AMS", "CMS"].includes(code)
                            ? rolesRes?.data?.result?.data ?? []
                            : rolesRes?.data ?? []
                    );
                    setLoadingRoles(false);

                    if (code === "AMS") {
                        setLoadingLocations(true);
                        const locRes = await apiFetch("/applications/integrations/ams/locations");
                        setLocations(locRes?.data?.result?.data ?? []);
                        setLoadingLocations(false);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setPageLoading(false);
            }
        };
        load();
    }, [request_code]);

    // ✅ Early returns dulu sebelum computed values
    if (pageLoading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;
    if (!request) return <div className="p-6 text-sm">Request not found.</div>;
    if (!app) return <div className="p-6 text-sm">Application not found.</div>;

    // ✅ Aman dihitung di sini, app sudah pasti ada
    const isAms = app.code === "AMS";
    const isDynamic = app.role_mode === "dynamic";
    const requestType: RequestType = request.type;

    const getRoleName = (id?: string) => {
        if (!id) return "-";
        return roles.find((r) => String(r.id) === String(id))?.name ?? id;
    };

    const getLocationName = (id?: string) => {
        if (!id) return "-";
        return locations.find((l) => String(l.id) === String(id))?.name ?? id;
    };

    const rejectedReason = request?.approvals?.find(
        (a: any) => a.status === "rejected" && a.reason
    )?.reason ?? null;

    const canProceed = () => {
        if (step === 3) {
            if (!form.justification.trim()) return false;
            if (isDynamic) return form.notes.trim() !== "";
            if (requestType === "application_access") {
                if (isAms) return form.newRole !== "" && form.newLocation !== "";
                return form.newRole !== "";
            }
            // change_role
            if (isAms) return form.newRole !== "" || form.newLocation !== "";
            return form.newRole !== "";
        }
        return true;
    };

    const handleSubmit = async () => {
        try {
            const selectedRole = roles.find((r) => String(r.id) === String(form.newRole));
            const selectedLocation = locations.find((l) => String(l.id) === String(form.newLocation));

            const res = await apiFetch(`/requests/${request_code}/revise`, {
                method: "PATCH",
                body: JSON.stringify({
                    new_role_id: isDynamic ? null : (form.newRole || null),
                    new_role_name: isDynamic ? null : (selectedRole?.name || null),
                    new_location_id: isAms ? (form.newLocation || null) : null,
                    new_location_name: isAms ? (selectedLocation?.name || null) : null,
                    notes: isDynamic ? form.notes : null,
                    justification: form.justification,
                }),
            });

            if (res?.success === false) throw new Error(res?.message || "Failed");

            await Swal.fire({
                icon: "success",
                title: "Revision submitted",
                text: "Your request has been resubmitted for approval.",
                confirmButtonText: "OK",
            });

            router.push("/requests");
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Failed", text: err?.message });
        }
    };

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-foreground mb-2">Revise Request</h1>
                    <p className="text-muted-foreground text-sm">
                        Update your request details and resubmit for approval.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isCompleted = step > s.id || s.id <= 2;

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
                                            {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className={`text-xs font-medium transition-colors whitespace-nowrap ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                                                }`}>
                                                {s.title}
                                            </p>
                                        </div>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`h-0.5 flex-1 mx-4 transition-colors duration-300 self-start mt-5 ${step > s.id || s.id < 2 ? "bg-primary" : "bg-border"
                                            }`} />
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
                            {step === 3 && "Update the details for your request"}
                            {step === 4 && "Review your revised request before resubmitting"}
                        </p>
                    </CardHeader>

                    <CardContent className="p-8 min-h-80">

                        {/* STEP 3 */}
                        {step === 3 && (
                            <div>
                                {rejectedReason && (
                                    <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                                        <p className="text-xs font-medium text-destructive mb-1">Rejection Reason</p>
                                        <p className="text-sm text-foreground">{rejectedReason}</p>
                                    </div>
                                )}

                                {requestType === "application_access" && (
                                    <div className="space-y-5">
                                        {isDynamic ? (
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
                                                <Select
                                                    value={form.newRole}
                                                    onValueChange={(v) => setForm({ ...form, newRole: v })}
                                                >
                                                    <SelectTrigger className="w-full px-5 py-8">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-60 overflow-y-auto">
                                                        {loadingRoles && <div className="px-3 py-2 text-sm text-muted-foreground">Loading roles...</div>}
                                                        {!loadingRoles && roles.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No roles available</div>}
                                                        {roles.map((r) => (
                                                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {isAms && (
                                            <div>
                                                <Label className="text-sm mb-3 block">Location</Label>
                                                <Select
                                                    value={form.newLocation}
                                                    onValueChange={(v) => setForm({ ...form, newLocation: v })}
                                                >
                                                    <SelectTrigger className="w-full px-5 py-8">
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-60 overflow-y-auto">
                                                        {loadingLocations && <div className="px-3 py-2 text-sm text-muted-foreground">Loading locations...</div>}
                                                        {locations.map((l) => (
                                                            <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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

                                {requestType === "change_role" && (
                                    <div className="space-y-5">
                                        <div>
                                            <Label className="text-sm mb-3 block">Current Role</Label>
                                            <Input value={request.old_role_name ?? "-"} disabled className="bg-muted cursor-not-allowed" />
                                        </div>

                                        {isDynamic ? (
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
                                                    {isAms && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
                                                </Label>
                                                <Select
                                                    value={form.newRole || "__none__"}
                                                    onValueChange={(v) => setForm({ ...form, newRole: v === "__clear__" || v === "__none__" ? "" : v })}
                                                >
                                                    <SelectTrigger className="w-full h-12">
                                                        <SelectValue placeholder="Select new role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {isAms && (
                                                            <SelectItem value={form.newRole !== "" ? "__clear__" : "__none__"} className="text-muted-foreground italic">
                                                                {form.newRole !== "" ? "— Clear selection —" : "— No change —"}
                                                            </SelectItem>
                                                        )}
                                                        {roles
                                                            .filter((r) => String(r.id) !== String(request.old_role_id))
                                                            .map((r) => (
                                                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                {isAms && <p className="text-xs text-muted-foreground mt-1">Leave empty if you only want to change location</p>}
                                            </div>
                                        )}

                                        {isAms && (
                                            <>
                                                <div>
                                                    <Label className="text-sm mb-3 block">Current Location</Label>
                                                    <Input value={request.old_location_name ?? "-"} disabled className="bg-muted cursor-not-allowed" />
                                                </div>
                                                <div>
                                                    <Label className="text-sm mb-3 block">
                                                        New Location
                                                        <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                                                    </Label>
                                                    <Select
                                                        value={form.newLocation || "__none__"}
                                                        onValueChange={(v) => setForm({ ...form, newLocation: v === "__clear__" || v === "__none__" ? "" : v })}
                                                    >
                                                        <SelectTrigger className="w-full px-5 py-8">
                                                            <SelectValue placeholder="Select new location" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60 overflow-y-auto">
                                                            {loadingLocations && <div className="px-3 py-2 text-sm text-muted-foreground">Loading locations...</div>}
                                                            <SelectItem value={form.newLocation !== "" ? "__clear__" : "__none__"} className="text-muted-foreground italic">
                                                                {form.newLocation !== "" ? "— Clear selection —" : "— No change —"}
                                                            </SelectItem>
                                                            {locations
                                                                .filter((l) => String(l.id) !== String(request.old_location_id))
                                                                .map((l) => (
                                                                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground mt-1">Leave empty if you only want to change role</p>
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

                                        <div className="flex items-start">
                                            <div className="w-32 text-sm text-muted-foreground">Request Type</div>
                                            <div className="flex-1 text-sm text-foreground">
                                                {requestType === "application_access" ? "Application Access" : "Role Change"}
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="w-32 text-sm text-muted-foreground">Application</div>
                                            <div className="flex-1 text-sm text-foreground">{app.name}</div>
                                        </div>

                                        {requestType === "application_access" ? (
                                            <>
                                                {isDynamic ? (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">Notes</div>
                                                        <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.notes}</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">Requested Role</div>
                                                        <div className="flex-1 text-sm text-foreground">{getRoleName(form.newRole)}</div>
                                                    </div>
                                                )}
                                                {isAms && (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">Location</div>
                                                        <div className="flex-1 text-sm text-foreground">{getLocationName(form.newLocation)}</div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-start">
                                                    <div className="w-32 text-sm text-muted-foreground">Current Role</div>
                                                    <div className="flex-1 text-sm text-foreground">{request.old_role_name ?? "-"}</div>
                                                </div>
                                                {isDynamic ? (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">Notes</div>
                                                        <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.notes}</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">New Role</div>
                                                        <div className="flex-1 text-sm text-foreground">{getRoleName(form.newRole)}</div>
                                                    </div>
                                                )}
                                                {isAms && (
                                                    <>
                                                        <div className="flex items-start">
                                                            <div className="w-32 text-sm text-muted-foreground">Current Location</div>
                                                            <div className="flex-1 text-sm text-foreground">{request.old_location_name ?? "-"}</div>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <div className="w-32 text-sm text-muted-foreground">New Location</div>
                                                            <div className="flex-1 text-sm text-foreground">{getLocationName(form.newLocation)}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        <div className="flex items-start">
                                            <div className="w-32 text-sm text-muted-foreground">Justification</div>
                                            <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">{form.justification}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                                    <p className="text-sm text-primary">
                                        Your revised request will be sent back to all approvers from the beginning.
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
                                onClick={() => step === 3 ? router.back() : setStep(step - 1)}
                                className="min-w-25"
                            >
                                {step === 3 ? "Cancel" : "Back"}
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
                                    <Button variant="outline" onClick={() => setStep(3)} className="min-w-25">
                                        Back
                                    </Button>
                                    <Button onClick={handleSubmit}>
                                        Resubmit Request
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