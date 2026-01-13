"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Building, MapPin, Calendar, Camera } from "lucide-react";
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "@/components/ui/select";

// Skeleton Components
function ProfileCardSkeleton() {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="absolute bottom-0 right-0 w-10 h-10 rounded-full" />
          </div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-36" />
          <div className="w-full my-4 h-px bg-border" />
          <div className="w-full space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="w-4 h-4 mr-3 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
            <div key={row} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

function SecuritySettingsSkeleton() {
  return (
    <Card className="bg-card border-border shadow-none mt-6">
      <CardHeader className="flex flex-row justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+62 812 3456 7890",
    department: "Information Technology",
    position: "Senior Developer",
    location: "Jakarta, Indonesia",
    joinDate: "2022-01-15",

    supervisor_id: "spv-001",
    supervisor: {
      id: "spv-001",
      name: "Michael Scott",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        // const res = await fetch("/api/profile");
        // const data = await res.json();
        // setProfile(data);

      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = () => {
    console.log("Saving profile:", profile);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };
  

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <ProfileCardSkeleton />
            ) : (
              <Card className="bg-card border-border shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {profile.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      {profile.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-1">
                      {profile.position}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.department}
                    </p>

                    <Separator className="my-4" />

                    <div className="w-full space-y-3 text-left">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                        <span className="text-foreground">{profile.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                        <span className="text-foreground">{profile.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                        <span className="text-foreground">{profile.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                        <span className="text-foreground">Joined {profile.joinDate}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Details Form */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <>
                <PersonalInfoSkeleton />
                <SecuritySettingsSkeleton />
              </>
            ) : (
              <>
                <Card className="bg-card border-border shadow-none">
                  <CardHeader className="flex flex-row justify-between">
                    <div>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                      <CardDescription>Manage your personal details</CardDescription>
                    </div>

                    {!isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Name */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Full Name
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.name}
                              onChange={(e) =>
                                setProfile({ ...profile, name: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Email Address
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.email}
                              onChange={(e) =>
                                setProfile({ ...profile, email: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Phone & Department */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Phone Number
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.phone}
                              onChange={(e) =>
                                setProfile({ ...profile, phone: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Department
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.department}
                              onChange={(e) =>
                                setProfile({ ...profile, department: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.department}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Position & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Position
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.position}
                              onChange={(e) =>
                                setProfile({ ...profile, position: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.position}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-foreground text-sm mb-2 block">
                            Location
                          </Label>
                          {isEditing ? (
                            <Input
                              value={profile.location}
                              onChange={(e) =>
                                setProfile({ ...profile, location: e.target.value })
                              }
                              className="w-full h-11 bg-background border-border text-foreground"
                            />
                          ) : (
                            <p className="text-foreground text-sm bg-muted/30 px-3 py-2.5 rounded-md">
                              {profile.location}
                            </p>
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

                {/* Security Settings Card */}
                <Card className="bg-card border-border shadow-none mt-6">
                  <CardHeader className="flex flex-row justify-between">
                    <div>
                      <CardTitle className="text-lg">Security Settings</CardTitle>
                      <CardDescription>Manage your account security</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-medium">Password</p>
                          <p className="text-muted-foreground text-xs">Last changed 3 months ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}