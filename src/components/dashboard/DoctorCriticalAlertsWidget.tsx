import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorReport } from "@/services/doctorService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DoctorCriticalAlertsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [criticalReports, setCriticalReports] = useState<DoctorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCriticalReports();
    }
  }, [user]);

  const fetchCriticalReports = async () => {
    if (!user) return;
    
    try {
      const profile = await doctorService.getDoctorProfile(user.id);
      if (profile) {
        const reports = await doctorService.getDoctorReports(profile.id);
        // Filter reports with risk indicators that are unread
        const critical = reports.filter(r => 
          r.risk_indicators && 
          r.risk_indicators.length > 0 && 
          !r.is_read
        );
        setCriticalReports(critical.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching critical reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={criticalReports.length > 0 ? "border-destructive/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${criticalReports.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              Critical Alerts
            </CardTitle>
            <CardDescription>Reports requiring attention</CardDescription>
          </div>
          {criticalReports.length > 0 && (
            <Badge variant="destructive">
              {criticalReports.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {criticalReports.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              No critical alerts at this time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalReports.map((report) => (
              <div 
                key={report.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {report.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(report.created_at), "MMM d, yyyy")}
                  </p>
                  {report.risk_indicators && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.risk_indicators.slice(0, 2).map((indicator, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-destructive/10">
                          {indicator}
                        </Badge>
                      ))}
                      {report.risk_indicators.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.risk_indicators.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => navigate("/doctor")}
            >
              View All Reports
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorCriticalAlertsWidget;
