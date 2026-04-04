import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Share2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import DocumentViewer from "@/components/reports/DocumentViewer";
import { ShareReportModal } from "@/components/reports/ShareReportModal";
import { databaseService } from "@/services/database";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const ReportAnalysis = () => {
  const { reportId } = useParams();
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch report data
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!reportId) throw new Error("Report ID is required");
      const data = await databaseService.medicalReports.getById(reportId);
      return data;
    },
    enabled: !!reportId,
  });

  // Fetch health metrics for this report
  const { data: healthMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["health-metrics", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const data = await databaseService.healthMetrics.getByReportId(reportId);
      return data || [];
    },
    enabled: !!reportId,
  });

  // Fetch specialist recommendations for this report
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["recommendations", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const data = await databaseService.recommendations.getByReportId(reportId);
      return data || [];
    },
    enabled: !!reportId,
  });

  const isLoading = reportLoading || metricsLoading || recommendationsLoading;

  if (isLoading) {
    return (
      <Layout showSidebar>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout showSidebar>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-muted-foreground">Report not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  const criticalFindings = healthMetrics?.filter(m => m.is_abnormal) || [];
  const hasRedFlags = report.has_critical_findings || criticalFindings.length > 0;

  return (
    <Layout showSidebar>
      <SEOHead title={`Analysis: ${report?.title || 'Report'}`} description="View AI-generated analysis, key findings, and specialist recommendations for your medical report." path={`/analysis/${reportId}`} />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/history">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{report.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-muted-foreground">
                    {report.report_date ? format(new Date(report.report_date), "MMM dd, yyyy") : "No date"}
                  </p>
                  <Badge variant="secondary">{report.report_type.replace("_", " ")}</Badge>
                  <Badge variant={report.status === "completed" ? "outline" : "secondary"}>
                    {report.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {report.ai_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis Summary</CardTitle>
                    <CardDescription>Easy-to-understand insights from your report</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{report.ai_summary}</p>
                  </CardContent>
                </Card>
              )}

              {healthMetrics && healthMetrics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {healthMetrics.map((metric, index) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{metric.metric_name}</p>
                          {!metric.is_abnormal ? (
                            <CheckCircle className="h-4 w-4 text-accent" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your value:</span>
                          <span className="font-medium">
                            {metric.metric_value} {metric.metric_unit}
                          </span>
                        </div>
                        {(metric.reference_range_min || metric.reference_range_max) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Normal range:</span>
                            <span>
                              {metric.reference_range_min || "?"} - {metric.reference_range_max || "?"} {metric.metric_unit}
                            </span>
                          </div>
                        )}
                        {index < healthMetrics.length - 1 && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {report.key_findings && report.key_findings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.key_findings.map((finding, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {hasRedFlags && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Red Flags
                    </CardTitle>
                    <CardDescription>Items requiring immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {criticalFindings.map((metric) => (
                        <li key={metric.id} className="text-sm flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span>
                            Abnormal {metric.metric_name}: {metric.metric_value} {metric.metric_unit}
                            {(metric.reference_range_min || metric.reference_range_max) && 
                              ` (Normal: ${metric.reference_range_min || "?"}-${metric.reference_range_max || "?"} ${metric.metric_unit})`
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {recommendations && recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Specialist Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{rec.specialty}</p>
                          <Badge variant={rec.urgency === "high" || rec.urgency === "critical" ? "destructive" : "secondary"}>
                            {rec.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                        {rec.recommended_actions && rec.recommended_actions.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {rec.recommended_actions.map((action, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {recommendations.length > 1 && <Separator className="mt-2" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <DocumentViewer fileUrl={report.file_url} fileName={report.file_name} />
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {report && (
        <ShareReportModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          reportId={report.id}
          reportTitle={report.title}
        />
      )}
    </Layout>
  );
};

export default ReportAnalysis;
