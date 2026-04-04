import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Stethoscope, 
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { subDays, format } from "date-fns";

const AdminUserGrowthWidget = () => {
  // Fetch user counts
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: async () => {
      // Get total users (profiles)
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total doctors
      const { count: totalDoctors } = await supabase
        .from('doctor_profiles')
        .select('*', { count: 'exact', head: true });

      // Get verified doctors
      const { count: verifiedDoctors } = await supabase
        .from('doctor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'approved');

      // Get total reports
      const { count: totalReports } = await supabase
        .from('medical_reports')
        .select('*', { count: 'exact', head: true });

      // Get new users this week
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // Get new reports this week
      const { count: newReportsThisWeek } = await supabase
        .from('medical_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      return {
        totalUsers: totalUsers || 0,
        totalDoctors: totalDoctors || 0,
        verifiedDoctors: verifiedDoctors || 0,
        totalReports: totalReports || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newReportsThisWeek: newReportsThisWeek || 0
      };
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.newUsersThisWeek || 0,
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-500"
    },
    {
      label: "Doctors",
      value: stats?.totalDoctors || 0,
      subtext: `${stats?.verifiedDoctors || 0} verified`,
      icon: <Stethoscope className="h-4 w-4" />,
      color: "text-emerald-500"
    },
    {
      label: "Total Reports",
      value: stats?.totalReports || 0,
      change: stats?.newReportsThisWeek || 0,
      icon: <FileText className="h-4 w-4" />,
      color: "text-purple-500"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Platform Growth
        </CardTitle>
        <CardDescription>Key platform metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div 
              key={metric.label}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${metric.color}`}>
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {metric.value.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {metric.change !== undefined && metric.change > 0 && (
                  <div className="flex items-center gap-1 text-emerald-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    +{metric.change} this week
                  </div>
                )}
                {metric.subtext && (
                  <p className="text-xs text-muted-foreground">{metric.subtext}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserGrowthWidget;
