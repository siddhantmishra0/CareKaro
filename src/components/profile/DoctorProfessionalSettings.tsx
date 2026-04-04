import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Building2, FileText, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorProfile } from "@/services/doctorService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Hematology",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology",
  "Gynecology",
  "Other",
];

const DoctorProfessionalSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [hospitalAffiliation, setHospitalAffiliation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  const { data: doctorProfile, isLoading } = useQuery({
    queryKey: ["doctorProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return doctorService.getDoctorProfile(user.id);
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (doctorProfile) {
      setFullName(doctorProfile.full_name || "");
      setSpecialization(doctorProfile.specialization || "");
      setLicenseNumber(doctorProfile.license_number || "");
      setHospitalAffiliation(doctorProfile.hospital_affiliation || "");
      setPhone(doctorProfile.phone || "");
      setBio(doctorProfile.bio || "");
    }
  }, [doctorProfile]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<DoctorProfile>) => {
      if (!doctorProfile?.id) throw new Error("No doctor profile found");
      return doctorService.updateDoctorProfile(doctorProfile.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
      toast({
        title: "Profile Updated",
        description: "Your professional profile has been updated successfully.",
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

  const handleSave = () => {
    updateMutation.mutate({
      full_name: fullName,
      specialization,
      hospital_affiliation: hospitalAffiliation || null,
      phone: phone || null,
      bio: bio || null,
    });
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-accent text-accent-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Professional Profile
              </CardTitle>
              <CardDescription>
                Manage your clinical credentials and professional information
              </CardDescription>
            </div>
            {doctorProfile && getVerificationBadge(doctorProfile.verification_status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger id="specialization">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  disabled
                  className="bg-muted"
                />
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                License number cannot be changed. Contact admin for updates.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospital" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Hospital Affiliation
            </Label>
            <Input
              id="hospital"
              value={hospitalAffiliation}
              onChange={(e) => setHospitalAffiliation(e.target.value)}
              placeholder="City General Hospital"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of your experience, qualifications, and areas of expertise..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This bio may be visible to patients when they receive reports from you.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending || !fullName || !specialization}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (doctorProfile) {
                  setFullName(doctorProfile.full_name || "");
                  setSpecialization(doctorProfile.specialization || "");
                  setHospitalAffiliation(doctorProfile.hospital_affiliation || "");
                  setPhone(doctorProfile.phone || "");
                  setBio(doctorProfile.bio || "");
                }
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {doctorProfile?.verification_status === "pending" && (
        <Card className="border-secondary bg-secondary/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">
                  Verification Pending
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your profile is under review by our admin team. You'll be notified once verification is complete.
                  Some features may be limited until verification is approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {doctorProfile?.verification_status === "rejected" && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Verification Rejected</h4>
                <p className="text-sm text-muted-foreground">
                  Your verification request was not approved. Please contact support for more information
                  or to submit additional documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorProfessionalSettings;
