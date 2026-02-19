"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

import RoleTable from "@/components/RoleTable";
import { lucideIconMap } from "@/lib/lucide-icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useParams } from "next/navigation"
import { apiFetch } from "@/lib/api"

import { createPortal } from "react-dom"

interface Application {
  id: number
  code: string
  name: string
  url: string
  owner: string
  icon: string
  color: string
}



function LucideIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  if (!name) return null

  const IconComp = (lucideIconMap as any)[name]
  if (!IconComp) return null

  return <IconComp className={className} />
}



function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (icon: string) => void
}) {
  const icons = Object.keys(lucideIconMap)

  return (
    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-auto">
      {icons.map((iconName) => {
        const IconComp = (lucideIconMap as any)[iconName]

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
        )
      })}
    </div>
  )
}


function PersonalInfoSkeleton() {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader className="flex flex-row justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {[1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-1 gap-4">
              {[1, 2].map((col) => (
                <div key={col}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          ))}
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleTableSkeleton() {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* table header */}
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-4 gap-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DetailApplicationPage() {
  const params = useParams()
  const code = params.code as string

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [application, setApplication] = useState<Application | null>(null)

  const [externalRoles, setExternalRoles] = useState<
    { id: string; name: string }[]
  >([])
  const [loadingExternalRoles, setLoadingExternalRoles] = useState(false)

  const [form, setForm] = useState<{
    code: string
    name: string
    url: string
    owner: string
    icon: string
    color: string
  }>({
    code: "",
    name: "",
    url: "",
    owner: "",
    icon: "",
    color: "#000000",
  })

  useEffect(() => {
    if (!code) return

    const fetchApplication = async () => {
      try {
        const res = await apiFetch(`/applications/by-code/${code}`)
        const data = res.data

        setApplication(data)
        setForm({
          code: data.code,
          name: data.name,
          url: data.url,
          owner: data.owner,
          icon: data.icon || "",
          color: data.color || "#000000",
        })

      } catch (error) {
        console.error("Failed to fetch application", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [code])

  useEffect(() => {
    if (!application) return

    const fetchExternalRoles = async () => {
      if (application.code !== "AMS" && application.code !== "IMS") {
        return
      }

      setLoadingExternalRoles(true)

      try {
        let endpoint = ""

        if (application.code === "AMS") {
          endpoint = "/applications/integrations/ams/roles"
        }

        if (application.code === "IMS") {
          endpoint = "/applications/integrations/ims/roles"
        }

        const res = await apiFetch(endpoint)
        const roles = (res.data?.result?.data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
        }))

        setExternalRoles(roles)
      } catch (err) {
        console.error("Failed to fetch external roles", err)
      } finally {
        setLoadingExternalRoles(false)
      }
    }

    fetchExternalRoles()
  }, [application])




  useEffect(() => {
    console.log("showIconPicker", showIconPicker)
  }, [showIconPicker])

  const handleSave = async () => {
    if (!application) return

    const payload = {
      name: form.name,
      url: form.url,
      owner: form.owner,
      icon: form.icon,
      color: form.color,
    }


    try {
      await apiFetch(`/applications/${application.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.error(err)
    }

    setApplication({ ...application, ...payload })
    setIsEditing(false)
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Detail Application
          </h1>
          <p className="text-muted-foreground text-sm">
            View detailed information about this application.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <>
                <PersonalInfoSkeleton />
              </>
            ) : (
              <>
                <Card className="bg-card border-border shadow-none">
                  <CardHeader className="flex flex-row justify-between">
                    <div>
                      <CardTitle className="text-lg">Application Information</CardTitle>
                      <CardDescription>Manage application details</CardDescription>
                    </div>

                    {!isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                      >
                        Edit Application
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Code</Label>
                          {isEditing ? (
                            <Input value={form.code} disabled />
                          ) : (
                            <p className="bg-muted/30 px-3 py-2.5 rounded-md">
                              {application?.code}
                            </p>
                          )}

                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Name</Label>
                          {isEditing ? (
                            <Input
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                          ) : (
                            <p className="bg-muted/30 px-3 py-2.5 rounded-md">
                              {application?.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application URL</Label>
                          {isEditing ? (
                            <Input
                              value={form.url}
                              onChange={(e) => setForm({ ...form, url: e.target.value })}
                            />
                          ) : (
                            <p className="bg-muted/30 px-3 py-2.5 rounded-md">
                              {application?.url}
                            </p>
                          )}

                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Owner</Label>
                          {isEditing ? (
                            <Input
                              value={form.owner}
                              onChange={(e) => setForm({ ...form, owner: e.target.value })}
                            />
                          ) : (
                            <p className="bg-muted/30 px-3 py-2.5 rounded-md">
                              {application?.owner}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 relative">
                        <div>
                          <Label>Application Icon</Label>

                          {isEditing ? (
                            <>
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
                            </>
                          ) : (
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2.5 rounded-md">
                              <LucideIcon name={application?.icon} className="w-4 h-4" />
                              <span className="text-sm">{application?.icon}</span>
                            </div>
                          )}
                        </div>
                      </div>



                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Color</Label>

                          {isEditing ? (
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
                          ) : (
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2.5 rounded-md">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: application?.color }}
                              />
                              <span className="text-sm">{application?.color}</span>
                            </div>
                          )}
                        </div>

                      </div>



                      {/* Action Buttons */}
                      {isEditing && (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSave}
                            className="flex-1"
                          >
                            Save Changes
                          </Button>
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right Column - Details Form */}
          <div className="lg:col-span-2">
            <div className="lg:col-span-2">
              {isLoading ? (
                <RoleTableSkeleton />
              ) : application?.code === "AMS" || application?.code === "IMS" ? (
                <Card className="bg-card border-border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg">External Roles</CardTitle>
                    <CardDescription>
                      Roles fetched directly from external API (read-only)
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {loadingExternalRoles ? (
                      <p className="text-sm text-muted-foreground">Loading roles...</p>
                    ) : (
                      <div className="space-y-2">
                        {externalRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex justify-between bg-muted/30 px-3 py-2 rounded-md text-sm"
                          >
                            <span className="font-mono text-xs">{role.id}</span>
                            <span>{role.name}</span>
                          </div>
                        ))}

                        {externalRoles.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No roles found.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : application ? (
                <RoleTable applicationId={String(application.id)} />
              ) : null}

            </div>
          </div>
        </div>
      </div>
      {showIconPicker &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-9999">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowIconPicker(false)}
            />

            {/* modal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-md shadow-xl p-4 max-h-[80vh] overflow-auto">
              <IconPicker
                value={form.icon}
                onChange={(icon) => {
                  setForm({ ...form, icon })
                  setShowIconPicker(false)
                }}
              />
            </div>
          </div>,
          document.body
        )}


    </main>
  );
}