import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Users, 
  FileText, 
  Calendar,
  Settings,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  variant?: "default" | "outline";
}

const DoctorQuickActionsWidget = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: "send-report",
      label: "Send Report",
      icon: <Send className="h-4 w-4" />,
      path: "/doctor/send-report",
      variant: "default"
    },
    {
      id: "view-patients",
      label: "View Patients",
      icon: <Users className="h-4 w-4" />,
      path: "/doctor",
      variant: "outline"
    },
    {
      id: "recent-reports",
      label: "Recent Reports",
      icon: <FileText className="h-4 w-4" />,
      path: "/doctor",
      variant: "outline"
    },
    {
      id: "profile-settings",
      label: "Profile Settings",
      icon: <Settings className="h-4 w-4" />,
      path: "/profile",
      variant: "outline"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks for your practice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            className="w-full justify-start gap-2"
            onClick={() => navigate(action.path)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default DoctorQuickActionsWidget;
