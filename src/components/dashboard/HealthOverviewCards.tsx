import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Droplet, Scale } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { databaseService } from "@/services/database";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const HealthOverviewCards = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;
      
      try {
        const data = await databaseService.healthMetrics.getByUserId(user.id);
        
        // Group metrics by name and get the latest value for each
        const metricsByName = new Map();
        data.forEach((metric: any) => {
          const existing = metricsByName.get(metric.metric_name);
          if (!existing || new Date(metric.recorded_at) > new Date(existing.recorded_at)) {
            metricsByName.set(metric.metric_name, metric);
          }
        });

        // Map to display format
        const displayMetrics = Array.from(metricsByName.values()).map((metric: any) => {
          const icon = getIconForMetric(metric.metric_name);
          const status = metric.is_abnormal ? "Abnormal" : "Normal";
          const statusColor = metric.is_abnormal ? "text-destructive" : "text-accent";
          
          return {
            title: formatMetricName(metric.metric_name),
            value: metric.metric_value.toString(),
            unit: metric.metric_unit,
            status,
            icon,
            statusColor
          };
        });

        setMetrics(displayMetrics);
      } catch (error) {
        console.error("Error fetching health metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  const getIconForMetric = (metricName: string) => {
    const name = metricName.toLowerCase();
    if (name.includes("pressure")) return Heart;
    if (name.includes("heart") || name.includes("pulse")) return Activity;
    if (name.includes("sugar") || name.includes("glucose")) return Droplet;
    if (name.includes("weight")) return Scale;
    return Activity;
  };

  const formatMetricName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No health metrics available. Upload a medical report to see your health data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className={`text-xs ${metric.statusColor}`}>{metric.status}</p>
              <p className="text-xs text-muted-foreground">{metric.trend} from last reading</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HealthOverviewCards;
