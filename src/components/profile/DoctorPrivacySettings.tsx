import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const DoctorPrivacySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadData = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No user session found.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const [profileResult, doctorProfileResult, reportsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("doctor_profiles").select("*").eq("user_id", user.id),
        supabase.from("doctor_reports").select("*").eq("doctor_id", user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        role: "doctor",
        profile: profileResult.data || [],
        doctorProfile: doctorProfileResult.data || [],
        sentReports: reportsResult.data || [],
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carekaro_doctor_data_${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error: any) {
      console.error("Error downloading data:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clinical Privacy Settings</CardTitle>
          <CardDescription>Control your professional data visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Profile to Patients</Label>
              <p className="text-sm text-muted-foreground">
                Allow patients to see your bio and specialization when receiving reports
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Contact Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Show your contact information on reports sent to patients
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics Contribution</Label>
              <p className="text-sm text-muted-foreground">
                Contribute anonymized clinical patterns to platform analytics
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your professional data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Download Your Data</h4>
            <p className="text-sm text-muted-foreground">
              Get a copy of your doctor profile and reports sent to patients
            </p>
            <Button variant="outline" onClick={handleDownloadData} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Account Deletion</h4>
            <p className="text-sm text-muted-foreground">
              Doctor accounts cannot be self-deleted. Please contact the platform administrator
              if you wish to deactivate your account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPrivacySettings;
