import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Server, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Clock
} from "lucide-react";

interface SystemStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  icon: React.ReactNode;
}

const AdminSystemHealthWidget = () => {
  // Check database health by making a simple query
  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ["system-health-db"],
    queryFn: async () => {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = Date.now() - start;
      return { healthy: !error, latency };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Check auth service
  const { data: authHealth, isLoading: authLoading } = useQuery({
    queryKey: ["system-health-auth"],
    queryFn: async () => {
      const start = Date.now();
      const { error } = await supabase.auth.getSession();
      const latency = Date.now() - start;
      return { healthy: !error, latency };
    },
    refetchInterval: 60000
  });

  // Check storage service
  const { data: storageHealth, isLoading: storageLoading } = useQuery({
    queryKey: ["system-health-storage"],
    queryFn: async () => {
      const start = Date.now();
      const { error } = await supabase.storage.listBuckets();
      const latency = Date.now() - start;
      return { healthy: !error, latency };
    },
    refetchInterval: 60000
  });

  const isLoading = dbLoading || authLoading || storageLoading;

  const services: SystemStatus[] = [
    {
      service: "Database",
      status: dbHealth?.healthy ? "healthy" : "down",
      latency: dbHealth?.latency,
      icon: <Database className="h-4 w-4" />
    },
    {
      service: "Authentication",
      status: authHealth?.healthy ? "healthy" : "down",
      latency: authHealth?.latency,
      icon: <Server className="h-4 w-4" />
    },
    {
      service: "Storage",
      status: storageHealth?.healthy ? "healthy" : "down",
      latency: storageHealth?.latency,
      icon: <Activity className="h-4 w-4" />
    }
  ];

  const allHealthy = services.every(s => s.status === "healthy");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-emerald-500";
      case "degraded": return "text-amber-500";
      case "down": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Healthy</Badge>;
      case "degraded": return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Degraded</Badge>;
      case "down": return <Badge variant="destructive">Down</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              System Health
            </CardTitle>
            <CardDescription>Real-time service status</CardDescription>
          </div>
          {allHealthy ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
              <CheckCircle className="h-3 w-3" />
              All Systems Operational
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Issues Detected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div 
            key={service.service}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-muted ${getStatusColor(service.status)}`}>
                {service.icon}
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{service.service}</p>
                {service.latency && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.latency}ms latency
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge(service.status)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminSystemHealthWidget;
