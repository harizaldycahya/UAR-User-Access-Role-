"use client";

import { useState } from "react";
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

type RequestType = "application_access" | "change_role" | "";

const steps = [
  { id: 1, title: "Request Type", icon: FileText },
  { id: 2, title: "Application", icon: Settings },
  { id: 3, title: "Details", icon: FileText },
  { id: 4, title: "Review", icon: CheckCircle2 },
];

export default function CreateRequestsPage() {
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
        return form.role !== "";
      }
      return form.oldRole !== "" && form.newRole !== "" && form.justification.trim() !== "";
    }
    return true;
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
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isCompleted
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
                        className={`text-xs font-medium transition-colors whitespace-nowrap ${
                          isActive || isCompleted
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
                      className={`h-0.5 flex-1 mx-4 transition-colors duration-300 self-start mt-5 ${
                        step > s.id
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
                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all ${
                      form.requestType === "application_access"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <RadioGroupItem value="application_access" id="access" />
                    <Label htmlFor="access" className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">Request Application Access</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Request access to a new application
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all ${
                      form.requestType === "change_role"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <RadioGroupItem value="change_role" id="change" />
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
                  <Label className="text-foreground text-sm mb-3 block">Select Application</Label>
                  <Select
                    value={form.application}
                    onValueChange={(value) =>
                      setForm({ ...form, application: value })
                    }
                  >
                    <SelectTrigger className="w-full h-12 bg-background border-border text-foreground">
                      <SelectValue placeholder="Choose application" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
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
                        <SelectTrigger className="w-full h-12 bg-background border-border text-foreground">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="admin" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Admin</SelectItem>
                          <SelectItem value="user" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
                          <SelectItem value="viewer" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Viewer</SelectItem>
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
                        <SelectTrigger className="w-full h-12 bg-background border-border text-foreground">
                          <SelectValue placeholder="Select current role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="user" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
                          <SelectItem value="viewer" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Viewer</SelectItem>
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
                        <SelectTrigger className="w-full h-12 bg-background border-border text-foreground">
                          <SelectValue placeholder="Select new role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="admin" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Admin</SelectItem>
                          <SelectItem value="user" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">User</SelectItem>
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
                  <Button
                    onClick={() => {
                      console.log("SUBMIT DATA:", form);
                      alert("Request submitted successfully!");
                    }}
                    className="min-w-30"
                  >
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