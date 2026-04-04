import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const NotificationPreferences = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
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
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders for scheduled medical appointments
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Health Tips</Label>
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

export default NotificationPreferences;
