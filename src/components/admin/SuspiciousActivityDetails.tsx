import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { suspiciousActivityService, SuspiciousActivity } from "@/services/suspiciousActivityService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, Shield, User, Clock, Activity, 
  CheckCircle, XCircle, AlertOctagon, FileText
} from "lucide-react";
import { format } from "date-fns";

interface SuspiciousActivityDetailsProps {
  activity: SuspiciousActivity;
  onClose: () => void;
  onAction: (activityId: string, action: "reviewed" | "dismissed" | "escalated", notes: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-blue-500 text-white",
};

const SuspiciousActivityDetails = ({ activity, onClose, onAction }: SuspiciousActivityDetailsProps) => {
  const [notes, setNotes] = useState(activity.resolution_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's recent activity
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["user-recent-activity", activity.user_id],
    queryFn: () => suspiciousActivityService.getUserRecentActivity(activity.user_id, 30),
    enabled: !!activity.user_id,
  });

  const handleAction = async (action: "reviewed" | "dismissed" | "escalated") => {
    if (!notes.trim() && action !== "reviewed") {
      return;
    }
    setIsSubmitting(true);
    try {
      await onAction(activity.id, action, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details = activity.details as Record<string, unknown> | null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${SEVERITY_COLORS[activity.severity]}`}>
              {activity.severity === "critical" ? (
                <AlertOctagon className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle>
                {suspiciousActivityService.getPatternLabel(activity.pattern_type)}
              </DialogTitle>
              <DialogDescription>
                Detected {format(new Date(activity.detected_at), "PPP 'at' h:mm:ss a")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
            <TabsTrigger value="action">Take Action</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto">
            <div className="space-y-4 p-1">
              {/* Status & Severity */}
              <div className="flex items-center gap-2">
                <Badge className={SEVERITY_COLORS[activity.severity]}>
                  {activity.severity.toUpperCase()}
                </Badge>
                <Badge variant={activity.status === "pending" ? "destructive" : "secondary"}>
                  {activity.status}
                </Badge>
              </div>

              {/* User Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">User Information</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {activity.user_name}</p>
                  <p><span className="text-muted-foreground">User ID:</span> {activity.user_id}</p>
                </div>
              </div>

              {/* Detection Details */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Detection Details</span>
                </div>
                <div className="text-sm space-y-1">
                  {details && (
                    <>
                      <p>
                        <span className="text-muted-foreground">Action Type:</span>{" "}
                        {String(details.action_type || "N/A").replace(/_/g, " ")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Event Count:</span>{" "}
                        <span className="font-semibold text-red-600">{String(details.event_count || "N/A")}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Threshold:</span>{" "}
                        {String(details.threshold_count || "N/A")} events in {String(details.window_minutes || "N/A")} minutes
                      </p>
                      <p>
                        <span className="text-muted-foreground">Category:</span>{" "}
                        {String(details.action_category || "N/A").replace(/_/g, " ")}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Review Info */}
              {activity.reviewed_at && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Review Information</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Reviewed At:</span>{" "}
                      {format(new Date(activity.reviewed_at), "PPP 'at' h:mm a")}
                    </p>
                    {activity.resolution_notes && (
                      <p>
                        <span className="text-muted-foreground">Notes:</span>{" "}
                        {activity.resolution_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {logsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !recentLogs || recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity found for this user
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {log.action_type?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.action_category?.replace(/_/g, " ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="action" className="flex-1">
            <div className="space-y-4 p-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                <Textarea
                  placeholder="Add notes about your investigation and decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleAction("reviewed")}
                  disabled={isSubmitting || activity.status !== "pending"}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Mark as Reviewed
                  <span className="text-xs text-muted-foreground ml-auto">
                    Acknowledged, no action needed
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleAction("dismissed")}
                  disabled={isSubmitting || !notes.trim() || activity.status === "dismissed"}
                >
                  <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                  Dismiss as False Positive
                  <span className="text-xs text-muted-foreground ml-auto">
                    {!notes.trim() ? "Notes required" : "Mark as not suspicious"}
                  </span>
                </Button>

                <Button
                  variant="destructive"
                  className="justify-start"
                  onClick={() => handleAction("escalated")}
                  disabled={isSubmitting || !notes.trim() || activity.status === "escalated"}
                >
                  <AlertOctagon className="h-4 w-4 mr-2" />
                  Escalate for Investigation
                  <span className="text-xs ml-auto">
                    {!notes.trim() ? "Notes required" : "Flag for further action"}
                  </span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SuspiciousActivityDetails;
