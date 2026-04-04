import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import PatientNotificationPreferences from "@/components/profile/PatientNotificationPreferences";
import DoctorNotificationPreferences from "@/components/profile/DoctorNotificationPreferences";
import AdminNotificationPreferences from "@/components/profile/AdminNotificationPreferences";
import PrivacyControls from "@/components/profile/PrivacyControls";
import DoctorPrivacySettings from "@/components/profile/DoctorPrivacySettings";
import AdminPrivacySettings from "@/components/profile/AdminPrivacySettings";
import DoctorProfessionalSettings from "@/components/profile/DoctorProfessionalSettings";
import SubscriptionManagement from "@/components/profile/SubscriptionManagement";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { storageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";
import { doctorService } from "@/services/doctorService";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, User, AlertCircle, Copy, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  blood_group: z.string().optional().or(z.literal("")),
  emergency_contact: z.string().trim().max(100).optional().or(z.literal("")),
  emergency_phone: z.string().trim().max(20).optional().or(z.literal("")),
  allergies: z.array(z.string()).optional(),
  chronic_conditions: z.array(z.string()).optional(),
  current_medications: z.array(z.string()).optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ProfileSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  const [medicationsText, setMedicationsText] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copiedPatientId, setCopiedPatientId] = useState(false);
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

  const handleCopyPatientId = async () => {
    if (profile?.patient_id) {
      await navigator.clipboard.writeText(profile.patient_id);
      setCopiedPatientId(true);
      setTimeout(() => setCopiedPatientId(false), 2000);
      toast({
        title: "Copied!",
        description: "Patient ID copied to clipboard",
      });
    }
  };

  const handleCopyDoctorId = async (doctorId: string) => {
    await navigator.clipboard.writeText(doctorId);
    setCopiedDoctorId(true);
    setTimeout(() => setCopiedDoctorId(false), 2000);
    toast({
      title: "Copied!",
      description: "Doctor ID copied to clipboard",
    });
  };

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    isError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check user role
  const { data: userRole } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user?.id) return "patient";
      const [isAdminResult, isDoctorResult] = await Promise.all([
        adminService.isAdmin(),
        doctorService.isVerifiedDoctor(user.id),
      ]);
      if (isAdminResult) return "admin";
      if (isDoctorResult) return "doctor";
      return "patient";
    },
    enabled: !!user?.id,
  });

  // Fetch doctor profile if user is a doctor
  const { data: doctorProfile, isLoading: doctorLoading, refetch: refetchDoctorProfile } = useQuery({
    queryKey: ["doctorProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return doctorService.getDoctorProfile(user.id);
    },
    enabled: !!user?.id,
  });

  const isDoctor = doctorProfile?.verification_status === 'approved';
  const isPatient = userRole === "patient";
  const isAdmin = userRole === "admin";

  const pageLoading = authLoading || isLoading;

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      if (profile.date_of_birth) {
        setDateOfBirth(new Date(profile.date_of_birth));
      }
      setGender(profile.gender || "");
      setBloodGroup(profile.blood_group || "");
      setEmergencyContact(profile.emergency_contact || "");
      setEmergencyPhone(profile.emergency_phone || "");
      setAllergiesText(profile.allergies?.join(", ") || "");
      setConditionsText(profile.chronic_conditions?.join(", ") || "");
      setMedicationsText(profile.current_medications?.join(", ") || "");
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          blood_group: data.blood_group || null,
          emergency_contact: data.emergency_contact || null,
          emergency_phone: data.emergency_phone || null,
          allergies: data.allergies || null,
          chronic_conditions: data.chronic_conditions || null,
          current_medications: data.current_medications || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    try {
      const data = profileSchema.parse({
        display_name: displayName,
        phone: phone,
        date_of_birth: dateOfBirth?.toISOString().split('T')[0] || "",
        gender: gender,
        blood_group: bloodGroup,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone,
        allergies: allergiesText ? allergiesText.split(",").map(a => a.trim()).filter(Boolean) : [],
        chronic_conditions: conditionsText ? conditionsText.split(",").map(c => c.trim()).filter(Boolean) : [],
        current_medications: medicationsText ? medicationsText.split(",").map(m => m.trim()).filter(Boolean) : [],
      });
      
      setErrors({});
      updateProfileMutation.mutate(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user?.id) return;

    const file = e.target.files[0];

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Avatar must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only JPG, PNG, and WEBP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload avatar
      const result = await storageService.uploadAvatar(user.id, file);

      // Update profile with new avatar URL
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: result.url })
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = () => {
    try {
      const data = passwordSchema.parse({
        newPassword,
        confirmPassword,
      });
      
      setErrors({});
      updatePasswordMutation.mutate(data.newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Validation Error",
          description: newErrors.confirmPassword || newErrors.newPassword,
          variant: "destructive",
        });
      }
    }
  };

  // Determine tabs based on role
  const getTabs = () => {
    if (isAdmin) {
      return [
        { value: "personal", label: "Personal" },
        { value: "subscription", label: "Subscription" },
        { value: "notifications", label: "Notifications" },
        { value: "privacy", label: "Privacy" },
      ];
    }
    if (isDoctor) {
      return [
        { value: "personal", label: "Personal" },
        { value: "professional", label: "Professional" },
        { value: "subscription", label: "Subscription" },
        { value: "notifications", label: "Notifications" },
        { value: "privacy", label: "Privacy" },
      ];
    }
    // Patient
    return [
      { value: "personal", label: "Personal" },
      { value: "health", label: "Health" },
      { value: "subscription", label: "Subscription" },
      { value: "notifications", label: "Notifications" },
      { value: "privacy", label: "Privacy" },
    ];
  };

  const tabs = getTabs();

  return (
    <Layout showSidebar>
      <SEOHead title="Profile Settings" description="Manage your CareKaro profile, health information, notification preferences, and privacy settings." path="/profile" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>

          {/* Patient ID Card - Only visible for patients */}
          {isPatient && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                {pageLoading ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-12 w-40" />
                  </div>
                ) : !user ? (
                  <div className="text-sm text-muted-foreground">
                    Please log in to view your Patient ID.
                  </div>
                ) : isError ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-destructive">
                      Couldn't load your profile. Please try again.
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchProfile()}>
                      Retry
                    </Button>
                  </div>
                ) : profile?.patient_id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-primary font-semibold text-base">Your Patient ID</Label>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          For doctor identification
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this ID with your doctor for quick identification when receiving reports
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-3 bg-background border border-primary/20 rounded-md font-mono text-lg font-bold text-primary">
                        {profile.patient_id}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPatientId}
                        className="h-12 w-12 border-primary/30 hover:bg-primary/10"
                      >
                        {copiedPatientId ? (
                          <Check className="h-5 w-5 text-accent" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Patient ID not available yet. Please refresh in a moment.
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchProfile()}>
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Doctor ID Card - Only visible for verified doctors */}
          {isDoctor && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                {doctorLoading ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-12 w-40" />
                  </div>
                ) : doctorProfile?.doctor_id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-accent font-semibold text-base">Your Doctor ID</Label>
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          For patient identification
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This is your unique identifier as a verified doctor on the platform
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-3 bg-background border border-accent/20 rounded-md font-mono text-lg font-bold text-accent">
                        {doctorProfile.doctor_id}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyDoctorId(doctorProfile.doctor_id)}
                        className="h-12 w-12 border-accent/30 hover:bg-accent/10"
                      >
                        {copiedDoctorId ? (
                          <Check className="h-5 w-5 text-accent" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Doctor ID not available yet. Please refresh in a moment.
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchDoctorProfile()}>
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="flex w-full gap-2">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-1 flex items-center justify-center min-w-0">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pageLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback>
                            <User className="h-10 w-10" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                          />
                          <label htmlFor="avatar-upload">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              disabled={isUploadingAvatar}
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                              </span>
                            </Button>
                          </label>
                          <p className="text-xs text-muted-foreground mt-2">
                            JPG, PNG or WEBP. Max 5MB.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name *</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className={errors.display_name ? "border-destructive" : ""}
                        />
                        {errors.display_name && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.display_name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed. Contact support if needed.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            Phone / WhatsApp Number
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                          />
                          <p className="text-xs text-muted-foreground">
                            Include country code (e.g. +91). Used for receiving reports via WhatsApp from your doctor.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select value={gender || undefined} onValueChange={setGender}>
                            <SelectTrigger id="gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateOfBirth && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateOfBirth}
                              onSelect={setDateOfBirth}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Emergency Contact - Only for patients */}
                      {isPatient && (
                        <>
                          <Separator />
                          <div className="space-y-4">
                            <h3 className="font-medium">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="emergencyContact">Contact Name</Label>
                                <Input
                                  id="emergencyContact"
                                  value={emergencyContact}
                                  onChange={(e) => setEmergencyContact(e.target.value)}
                                  placeholder="Full name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="emergencyPhone">Contact Phone</Label>
                                <Input
                                  id="emergencyPhone"
                                  type="tel"
                                  value={emergencyPhone}
                                  onChange={(e) => setEmergencyPhone(e.target.value)}
                                  placeholder="+1 (555) 123-4567"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            if (profile) {
                              setDisplayName(profile.display_name || "");
                              setPhone(profile.phone || "");
                              setGender(profile.gender || "");
                              setEmergencyContact(profile.emergency_contact || "");
                              setEmergencyPhone(profile.emergency_phone || "");
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <Button 
                    onClick={handleUpdatePassword}
                    disabled={updatePasswordMutation.isPending || !newPassword || !confirmPassword}
                  >
                    {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Tab - Only for patients */}
            {isPatient && (
              <TabsContent value="health" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Health Profile</CardTitle>
                    <CardDescription>Manage your health information for better analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pageLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bloodGroup">Blood Group</Label>
                          <Select value={bloodGroup} onValueChange={setBloodGroup}>
                            <SelectTrigger id="bloodGroup">
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="allergies">Known Allergies</Label>
                          <Textarea
                            id="allergies"
                            value={allergiesText}
                            onChange={(e) => setAllergiesText(e.target.value)}
                            placeholder="Enter allergies separated by commas (e.g., Penicillin, Peanuts, Shellfish)"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Separate multiple allergies with commas
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="conditions">Chronic Conditions</Label>
                          <Textarea
                            id="conditions"
                            value={conditionsText}
                            onChange={(e) => setConditionsText(e.target.value)}
                            placeholder="Enter conditions separated by commas (e.g., Diabetes Type 2, Hypertension)"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Separate multiple conditions with commas, or click to add:
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {[
                              "Diabetes Type 2", "Diabetes Type 1", "Hypertension", "Asthma",
                              "Heart Disease", "Thyroid Disorder", "Arthritis", "COPD",
                              "High Cholesterol", "Anemia", "PCOS", "Migraine",
                            ].map((condition) => {
                              const currentConditions = conditionsText
                                .split(",")
                                .map((c) => c.trim().toLowerCase())
                                .filter(Boolean);
                              const isSelected = currentConditions.includes(condition.toLowerCase());
                              return (
                                <button
                                  key={condition}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      const updated = conditionsText
                                        .split(",")
                                        .map((c) => c.trim())
                                        .filter((c) => c.toLowerCase() !== condition.toLowerCase())
                                        .join(", ");
                                      setConditionsText(updated);
                                    } else {
                                      setConditionsText(
                                        conditionsText ? `${conditionsText.replace(/,\s*$/, "")}, ${condition}` : condition
                                      );
                                    }
                                  }}
                                  className={cn(
                                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  {isSelected ? "✓ " : "+ "}{condition}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="medications">Current Medications</Label>
                          <Textarea
                            id="medications"
                            value={medicationsText}
                            onChange={(e) => setMedicationsText(e.target.value)}
                            placeholder="Enter medications separated by commas (e.g., Metformin 500mg, Lisinopril 10mg)"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Include dosage if known. Separate multiple medications with commas
                          </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Health Profile"}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              if (profile) {
                                setBloodGroup(profile.blood_group || "");
                                setAllergiesText(profile.allergies?.join(", ") || "");
                                setConditionsText(profile.chronic_conditions?.join(", ") || "");
                                setMedicationsText(profile.current_medications?.join(", ") || "");
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Professional Tab - Only for doctors */}
            {isDoctor && (
              <TabsContent value="professional">
                <DoctorProfessionalSettings />
              </TabsContent>
            )}

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <SubscriptionManagement />
            </TabsContent>

            {/* Notifications Tab - Role-specific */}
            <TabsContent value="notifications">
              {isAdmin ? (
                <AdminNotificationPreferences />
              ) : isDoctor ? (
                <DoctorNotificationPreferences />
              ) : (
                <PatientNotificationPreferences />
              )}
            </TabsContent>

            {/* Privacy Tab - Role-specific */}
            <TabsContent value="privacy">
              {isAdmin ? (
                <AdminPrivacySettings />
              ) : isDoctor ? (
                <DoctorPrivacySettings />
              ) : (
                <PrivacyControls />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
