"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiAxios } from "@/lib/api";
import { lucideIconMap } from "@/lib/lucide-icons";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { createPortal } from "react-dom";

function LucideIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const IconComp = (lucideIconMap as any)[name];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const icons = Object.keys(lucideIconMap);

  return (
    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-auto">
      {icons.map((iconName) => {
        const IconComp = (lucideIconMap as any)[iconName];

        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`p-2 rounded-md border hover:bg-muted flex items-center justify-center
              ${value === iconName ? "border-primary bg-muted" : ""}
            `}
          >
            <IconComp className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

export default function CreateApplicationPage() {
  const router = useRouter();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    url: "",
    owner: "",
    icon: "",
    color: "#000000"
  });


  const handleCreate = async () => {
    if (!form.code || !form.name) return;

    setIsSubmitting(true);

    try {
      const res = await apiAxios.post("/applications", form);

      const created = res.data.data;

      router.push(`/applications/${created.code}`);
    } catch (err: any) {
      console.error("Failed to create application:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Create Application
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a new application to the system.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-card border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">
              Application Information
            </CardTitle>
            <CardDescription>
              Fill in the details below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label>Application Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Application Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Application URL</Label>
              <Input
                value={form.url}
                onChange={(e) =>
                  setForm({ ...form, url: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Application Owner</Label>
              <Input
                value={form.owner}
                onChange={(e) =>
                  setForm({ ...form, owner: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Application Icon</Label>

              <div
                className="flex items-center gap-2 mb-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted"
                onClick={() => setShowIconPicker((v) => !v)}
              >
                {form.icon ? (
                  <LucideIcon name={form.icon} className="w-5 h-5" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Click to select icon
                  </span>
                )}

                <span className="text-sm text-muted-foreground">
                  {form.icon || "Select icon"}
                </span>

                <span className="ml-auto text-xs text-muted-foreground">
                  Change
                </span>
              </div>
            </div>

            <div>
              <Label>Application Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value })
                  }
                  className="w-12 h-10 p-1 rounded border cursor-pointer"
                />
                <Input value={form.color} readOnly />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreate}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Application"}
              </Button>

              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showIconPicker &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowIconPicker(false)}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-md shadow-xl p-4 max-h-[80vh] overflow-auto">
              <IconPicker
                value={form.icon}
                onChange={(icon) => {
                  setForm({ ...form, icon });
                  setShowIconPicker(false);
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
