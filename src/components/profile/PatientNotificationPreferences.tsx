import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const PatientNotificationPreferences = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose how you want to be notified about your health updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Report Analysis Complete</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your medical report analysis is ready
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Critical Health Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Immediate notifications for red flags in your reports
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Doctor Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a doctor sends you a new report
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders for scheduled medical appointments
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Family Activity</Label>
              <p className="text-sm text-muted-foreground">
                Updates when family members share health data with you
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Health Tips & Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Weekly health tips and wellness recommendations
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Updates about new features and promotions
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

export default PatientNotificationPreferences;
