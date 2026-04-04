import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, UserCheck, Settings, Users } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActionsPanel = () => {
  const actions = [
    {
      title: "Upload Report",
      description: "Add a new medical report",
      icon: Upload,
      href: "/upload",
      variant: "default" as const
    },
    {
      title: "View Trends",
      description: "Track health metrics",
      icon: TrendingUp,
      href: "/trends",
      variant: "secondary" as const
    },
    {
      title: "Specialists",
      description: "View recommendations",
      icon: UserCheck,
      href: "/recommendations",
      variant: "secondary" as const
    },
    {
      title: "Family",
      description: "Manage family members",
      icon: Users,
      href: "/family",
      variant: "secondary" as const
    },
    {
      title: "Settings",
      description: "Manage your profile",
      icon: Settings,
      href: "/profile",
      variant: "secondary" as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className="w-full justify-start"
            asChild
          >
            <Link to={action.href}>
              <action.icon className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-70">{action.description}</div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
