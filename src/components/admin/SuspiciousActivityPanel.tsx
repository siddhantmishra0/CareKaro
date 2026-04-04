import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { suspiciousActivityService, SuspiciousActivity, SuspiciousActivityFilters } from "@/services/suspiciousActivityService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, Shield, Search, ChevronLeft, ChevronRight,
  Eye, XCircle, AlertOctagon, Clock, User, Activity
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import SuspiciousActivityDetails from "./SuspiciousActivityDetails";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-blue-500 text-white",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "destructive",
  escalated: "default",
  reviewed: "secondary",
  dismissed: "outline",
};

const SuspiciousActivityPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SuspiciousActivityFilters>({
    status: "all",
    severity: "all",
    patternType: "all",
    page: 1,
    perPage: 20,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);

  // Fetch suspicious activities
  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ["suspicious-activities", filters],
    queryFn: () => suspiciousActivityService.getActivities(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["suspicious-activities-stats"],
    queryFn: () => suspiciousActivityService.getStats(),
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("suspicious-activities-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "suspicious_activities",
        },
        (payload) => {
          toast.warning(
            `New Suspicious Activity Detected: ${suspiciousActivityService.getPatternLabel((payload.new as any).pattern_type)}`,
            {
              description: `Severity: ${(payload.new as any).severity}`,
              duration: 10000,
              icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
            }
          );
          queryClient.invalidateQueries({ queryKey: ["suspicious-activities"] });
          queryClient.invalidateQueries({ queryKey: ["suspicious-activities-stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "suspicious_activities",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["suspicious-activities"] });
          queryClient.invalidateQueries({ queryKey: ["suspicious-activities-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleAction = useCallback(async (
    activityId: string,
    action: "reviewed" | "dismissed" | "escalated",
    notes: string
  ) => {
    if (!user?.id) return;
    
    try {
      await suspiciousActivityService.updateStatus(activityId, action, notes, user.id);
      toast.success(`Activity marked as ${action}`);
      setSelectedActivity(null);
      refetch();
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity status");
    }
  }, [user?.id, refetch]);

  const filteredActivities = activitiesData?.data.filter((activity) =>
    searchQuery
      ? activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.pattern_type.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const totalPages = Math.ceil((activitiesData?.count || 0) / (filters.perPage || 20));

  if (isLoading && !activitiesData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Suspicious Activity Monitor</h2>
        <p className="text-muted-foreground">
          Automated detection of unusual user behavior patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats?.pending || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-3xl text-red-700">{stats?.critical || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardDescription>High</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats?.high || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Escalated</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.escalated || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters({ ...filters, status: v as any, page: 1 })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.severity}
          onValueChange={(v) => setFilters({ ...filters, severity: v as any, page: 1 })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Detected Activities
          </CardTitle>
          <CardDescription>
            Activities flagged by automated pattern detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !filteredActivities || filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No suspicious activities detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${SEVERITY_COLORS[activity.severity]}`}
                  >
                    {activity.severity === "critical" ? (
                      <AlertOctagon className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">
                        {suspiciousActivityService.getPatternLabel(activity.pattern_type)}
                      </span>
                      <Badge className={SEVERITY_COLORS[activity.severity]}>
                        {activity.severity}
                      </Badge>
                      <Badge variant={STATUS_VARIANTS[activity.status]}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{activity.user_name}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(activity.detected_at), "PPP 'at' h:mm a")}</span>
                    </div>
                    {activity.details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Events: {(activity.details as any).event_count || "N/A"} / 
                        Threshold: {(activity.details as any).threshold_count || "N/A"}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActivity(activity);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) >= totalPages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedActivity && (
        <SuspiciousActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default SuspiciousActivityPanel;
