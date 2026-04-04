import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const AdminNotificationPreferences = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Configure notifications for platform administration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Doctor Verification Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new doctors request verification
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Suspicious Activity Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Immediate alerts for detected suspicious activities
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Incidents</Label>
              <p className="text-sm text-muted-foreground">
                Critical security events requiring immediate attention
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Platform Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Daily digest of platform usage and performance metrics
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>User Reports & Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when users submit reports or feedback
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Maintenance Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Reminders for scheduled maintenance and updates
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

export default AdminNotificationPreferences;
