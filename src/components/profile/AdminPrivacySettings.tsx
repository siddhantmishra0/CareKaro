import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AdminPrivacySettings = () => {
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
      const [profileResult, auditLogsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("audit_logs").select("*").eq("user_id", user.id).limit(100),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        role: "admin",
        profile: profileResult.data || [],
        recentAuditLogs: auditLogsResult.data || [],
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carekaro_admin_data_${format(new Date(), "yyyy-MM-dd")}.json`;
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Privacy Settings
          </CardTitle>
          <CardDescription>Configure your admin account privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activity Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log your administrative actions for compliance (recommended)
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get alerts for new admin sessions from other devices
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for sensitive administrative actions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your admin account data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Download Your Data</h4>
            <p className="text-sm text-muted-foreground">
              Get a copy of your admin profile and recent activity logs
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
              Admin accounts require manual deletion by the platform owner.
              Contact the system administrator to request account removal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrivacySettings;
