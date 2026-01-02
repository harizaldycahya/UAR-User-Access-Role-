"use client";

import { useState } from "react";
import { SubmitResultDialog } from "@/components/submit-result-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
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
import { Check, FileText, Settings, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";


type RequestType = "application_access" | "change_role" | "";


const steps = [
    { id: 1, title: "Request Type", icon: FileText },
    { id: 2, title: "Application", icon: Settings },
    { id: 3, title: "Details", icon: FileText },
    { id: 4, title: "Review", icon: CheckCircle2 },
];

export default function CreateRequestsPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        requestType: "" as RequestType,
        application: "",
        role: "",
        oldRole: "",
        newRole: "",
        justification: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const [resultDialog, setResultDialog] = useState<{
        open: boolean;
        variant: "success" | "error";
        title: string;
        description?: string;
    }>({
        open: false,
        variant: "success",
        title: "",
    });


    const canProceed = () => {
        if (step === 1) return form.requestType !== "";
        if (step === 2) return form.application !== "";
        if (step === 3) {
            if (form.requestType === "application_access") {
                return form.role !== "";
            }
            return form.oldRole !== "" && form.newRole !== "" && form.justification.trim() !== "";
        }
        return true;
    };

    return (
        <main className="min-h-screen bg-background p-6">

            {/* test */}

            <Card className="flex-1 border-border/40">
                <CardHeader className="border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">Create Request</CardTitle>
                                <CardDescription className="text-xs">Submit your application access or role change request</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="max-w-7xl">
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
                                                    className={`h-[2px] flex-1 mx-4 transition-colors duration-300 self-start mt-5 ${step > s.id
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

                            <CardContent className="p-8 min-h-[320px]">
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
                                            {/* OPTION 1 */}
                                            <div className="relative">
                                                <RadioGroupItem
                                                    value="application_access"
                                                    id="access"
                                                    className="sr-only"
                                                />

                                                <Label
                                                    htmlFor="access"
                                                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all
                                                            ${form.requestType === "application_access"
                                                            ? "border-primary bg-primary/10"
                                                            : "border-border hover:border-muted-foreground/30 bg-card"
                                                        }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-foreground">
                                                            Request Application Access
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-0.5">
                                                            Request access to a new application
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>

                                            {/* OPTION 2 */}
                                            <div className="relative">
                                                <RadioGroupItem
                                                    value="change_role"
                                                    id="change"
                                                    className="sr-only"
                                                />

                                                <Label
                                                    htmlFor="change"
                                                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all
                                                            ${form.requestType === "change_role"
                                                            ? "border-primary bg-primary/10"
                                                            : "border-border hover:border-muted-foreground/30 bg-card"
                                                        }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-foreground">
                                                            Change Role
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-0.5">
                                                            Request to change your current role
                                                        </div>
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
                                            <Label className="text-foreground text-sm mb-3 block">Select Application</Label>
                                            <Select
                                                value={form.application}
                                                onValueChange={(value) =>
                                                    setForm({ ...form, application: value })
                                                }
                                            >
                                                <SelectTrigger className="py-7 w-full h-12 bg-background border-border text-foreground">
                                                    <SelectValue placeholder="Choose application" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border px-4 py-7">
                                                    <SelectItem value="hris" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex flex-col items-start py-1">
                                                            <span className="font-medium">HRIS</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Human Resources Information System
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="finance" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex flex-col items-start py-1">
                                                            <span className="font-medium">Finance</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Financial Management System
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="inventory" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex flex-col items-start py-1">
                                                            <span className="font-medium">Inventory</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Inventory Management System
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {step === 3 && (
                                    <div>
                                        {form.requestType === "application_access" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-foreground text-sm mb-3 block">Requested Role</Label>
                                                    <Select
                                                        value={form.role}
                                                        onValueChange={(value) =>
                                                            setForm({ ...form, role: value })
                                                        }
                                                    >
                                                        <SelectTrigger className=" py-7 w-full h-12 bg-background border-border text-foreground">
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                        <SelectContent className=" bg-popover border-border">
                                                            <SelectItem value="admin" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">Admin</SelectItem>
                                                            <SelectItem value="user" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
                                                            <SelectItem value="viewer" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">Viewer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {form.requestType === "change_role" && (
                                            <div className="space-y-5">
                                                <div>
                                                    <Label className="text-foreground text-sm mb-3 block">Current Role</Label>
                                                    <Select
                                                        value={form.oldRole}
                                                        onValueChange={(value) =>
                                                            setForm({ ...form, oldRole: value })
                                                        }
                                                    >
                                                        <SelectTrigger className="py-7 w-full h-12 bg-background border-border text-foreground">
                                                            <SelectValue placeholder="Select current role" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-popover border-border">
                                                            <SelectItem value="user" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
                                                            <SelectItem value="viewer" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">Viewer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label className="text-foreground text-sm mb-3 block">New Role</Label>
                                                    <Select
                                                        value={form.newRole}
                                                        onValueChange={(value) =>
                                                            setForm({ ...form, newRole: value })
                                                        }
                                                    >
                                                        <SelectTrigger className="py-7 w-full h-12 bg-background border-border text-foreground">
                                                            <SelectValue placeholder="Select new role" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-popover border-border">
                                                            <SelectItem value="admin" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">Admin</SelectItem>
                                                            <SelectItem value="user" className="py-3 text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
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
                                                        className="w-full min-h-[120px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
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
                                                    <div className="flex-1 text-sm text-foreground capitalize">
                                                        {form.application}
                                                    </div>
                                                </div>

                                                {form.requestType === "application_access" ? (
                                                    <div className="flex items-start">
                                                        <div className="w-32 text-sm text-muted-foreground">Role</div>
                                                        <div className="flex-1 text-sm text-foreground capitalize">
                                                            {form.role}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start">
                                                            <div className="w-32 text-sm text-muted-foreground">Current Role</div>
                                                            <div className="flex-1 text-sm text-foreground capitalize">
                                                                {form.oldRole}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <div className="w-32 text-sm text-muted-foreground">New Role</div>
                                                            <div className="flex-1 text-sm text-foreground capitalize">
                                                                {form.newRole}
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
                                        className="min-w-[100px]"
                                    >
                                        Back
                                    </Button>

                                    {step < 4 ? (
                                        <Button
                                            onClick={() => setStep(step + 1)}
                                            disabled={!canProceed()}
                                            className="min-w-[100px]"
                                        >
                                            Next
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setStep(1)}
                                                className="min-w-[100px]"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    setSubmitting(true);

                                                    try {
                                                        await new Promise((r) => setTimeout(r, 1500));

                                                        console.log("SUBMIT DATA:", form);

                                                        setResultDialog({
                                                            open: true,
                                                            variant: "success",
                                                            title: "Request Submitted",
                                                            description:
                                                                "Your request has been sent and is waiting for approval.",
                                                        });
                                                    } catch {
                                                        setResultDialog({
                                                            open: true,
                                                            variant: "error",
                                                            title: "Submission Failed",
                                                            description:
                                                                "Something went wrong while submitting your request.",
                                                        });
                                                    } finally {
                                                        setSubmitting(false);
                                                    }
                                                }}

                                                disabled={submitting}

                                                className="min-w-[120px]"
                                            > Submit
                                                {submitting && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <SubmitResultDialog
                open={resultDialog.open}
                variant={resultDialog.variant}
                title={resultDialog.title}
                description={resultDialog.description}
                onClose={() => {
                    setResultDialog({ ...resultDialog, open: false });

                    if (resultDialog.variant === "success") {
                        router.push("/requests");
                    }
                }}
            />

        </main>
    );
}