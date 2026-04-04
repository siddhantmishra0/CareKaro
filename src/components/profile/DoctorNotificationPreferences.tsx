import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const DoctorNotificationPreferences = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose how you want to be notified about clinical activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Report Delivery Confirmation</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a patient views a report you sent
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Critical Patient Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alerts when critical findings are detected in your patients' reports
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Verification Updates</Label>
              <p className="text-sm text-muted-foreground">
                Updates on your verification status from admin
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Platform Announcements</Label>
              <p className="text-sm text-muted-foreground">
                Important updates about the platform for healthcare providers
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Weekly digest of your clinical activity on the platform
              </p>
            </div>
            <Switch />
          </div>
        </div>

        <Button>Save Preferences</Button>
      </CardContent>
    </Card>
  );
};

export default DoctorNotificationPreferences;
