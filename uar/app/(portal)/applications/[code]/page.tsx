"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

import RoleTable from "@/components/RoleTable";


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


interface Application {
  id: number
  code: string
  name: string
  url: string
  owner: string
  icon: string
  color: string
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


export default function DetailApplicationPage() {
  const params = useParams()
  const applicationId = params.id

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [application, setApplication] = useState<Application | null>(null)
  const [form, setForm] = useState({
    code: "",
    name: "",
    url: "",
    owner: "",
    icon: "",
    color: "",
  })

  useEffect(() => {
    if (!applicationId) return

    const fetchApplication = async () => {
      try {
        const res = await apiFetch(`/applications/${applicationId}`)
        const data = res.data

        setApplication(data)
        setForm({
          code: data.code,
          name: data.name,
          url: data.url,
          owner: data.owner,
          icon: data.icon,
          color: data.color,
        })
      } catch (error) {
        console.error("Failed to fetch application", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId])

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
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugiat, beatae?
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
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Icon</Label>
                          {isEditing ? (
                            <Input
                              value={form.icon}
                              onChange={(e) => setForm({ ...form, icon: e.target.value })}
                            />
                          ) : (
                            <p className="bg-muted/30 px-3 py-2.5 rounded-md">
                              {application?.icon}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Application Color</Label>
                          {isEditing ? (
                            <Input
                              value={form.color}
                              onChange={(e) => setForm({ ...form, color: e.target.value })}
                            />
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
            <RoleTable applicationId={applicationId as string} />
          </div>
        </div>
      </div>
    </main>
  );
}