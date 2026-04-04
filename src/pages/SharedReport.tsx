import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DocumentViewer from "@/components/reports/DocumentViewer";
import SpecialistCard from "@/components/recommendations/SpecialistCard";
import { AlertCircle, Calendar, FileText, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { shareService } from "@/services/shareService";

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    const fetchSharedReport = async () => {
      try {
        const result = await shareService.viewSharedReport(token);
        setData(result);
      } catch (err: any) {
        setError(err.error || err.message || "Failed to load shared report");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Unable to Access Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              This link may have expired, reached its maximum access limit, or been revoked by the owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { report, healthMetrics, recommendations, shareInfo } = data;
  const criticalFindings = healthMetrics.filter((m: any) => m.is_abnormal);
  const hasRedFlags = report.has_critical_findings || criticalFindings.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Securely Shared Medical Report</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            {report.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {report.report_date
                  ? format(new Date(report.report_date), "MMM dd, yyyy")
                  : "Date not specified"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="capitalize">{report.report_type.replace(/_/g, " ")}</span>
            </div>
            <Badge variant={report.status === "completed" ? "default" : "secondary"}>
              {report.status}
            </Badge>
          </div>
        </div>

        {/* Expiration Notice */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This shared link expires on{" "}
            {format(new Date(shareInfo.expires_at), "MMM dd, yyyy 'at' HH:mm")}
            {shareInfo.recipient_email && (
              <> • Shared with: {shareInfo.recipient_email}</>
            )}
          </AlertDescription>
        </Alert>

        {/* Red Flags Alert */}
        {hasRedFlags && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This report contains critical health findings that require immediate medical attention.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Summary */}
        {report.ai_summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{report.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Findings */}
        {report.key_findings && report.key_findings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.key_findings.map((finding: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Critical Findings */}
        {criticalFindings.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticalFindings.map((metric: any) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{metric.metric_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.reference_range_min && metric.reference_range_max && (
                          <>Normal range: {metric.reference_range_min} - {metric.reference_range_max} {metric.metric_unit}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-destructive">
                        {metric.metric_value} {metric.metric_unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Metrics */}
        {healthMetrics.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthMetrics
                  .filter((m: any) => !m.is_abnormal)
                  .map((metric: any) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{metric.metric_name}</p>
                        {metric.reference_range_min && metric.reference_range_max && (
                          <p className="text-sm text-muted-foreground">
                            Normal: {metric.reference_range_min} - {metric.reference_range_max} {metric.metric_unit}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {metric.metric_value} {metric.metric_unit}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Specialist Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
              Specialist Recommendations
            </h2>
            <div className="grid gap-4">
              {recommendations.map((rec: any) => (
                <SpecialistCard 
                  key={rec.id} 
                  recommendation={rec}
                  onAcknowledge={() => {}}
                  isAcknowledging={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Document Viewer */}
        {report.file_url && (
          <Card>
            <CardHeader>
              <CardTitle>Original Report</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentViewer fileUrl={report.file_url} fileName={report.file_name || "report"} isPreSigned />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
