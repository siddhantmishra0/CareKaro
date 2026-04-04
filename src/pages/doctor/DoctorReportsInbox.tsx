import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorReport, DoctorProfile } from "@/services/doctorService";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, AlertTriangle, CheckCircle, Eye, Download, User, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type ReportWithDoctor = DoctorReport & { doctor_profile: DoctorProfile };

const DoctorReportsInbox = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportWithDoctor | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await doctorService.getPatientReports(user.id);
      setReports(data);
    } catch (error) {
      console.error("Error fetching doctor reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: ReportWithDoctor) => {
    setSelectedReport(report);
    
    // Mark as read if not already
    if (!report.is_read) {
      try {
        await doctorService.markReportAsRead(report.id);
        setReports(prev => prev.map(r => 
          r.id === report.id ? { ...r, is_read: true, read_at: new Date().toISOString() } : r
        ));
      } catch (error) {
        console.error("Error marking report as read:", error);
      }
    }

    // Get signed URL if file exists
    if (report.file_url) {
      try {
        const { data, error } = await supabase.storage
          .from('medical-reports')
          .createSignedUrl(report.file_url, 900); // 15 min
        
        if (!error && data) {
          setSignedUrl(data.signedUrl);
        }
      } catch (error) {
        console.error("Error getting signed URL:", error);
      }
    }

    setViewerOpen(true);
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      prescription: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      blood_test: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      scan: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      xray: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      mri: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      report: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[type] || colors.report;
  };

  const unreadCount = reports.filter(r => !r.is_read).length;

  return (
    <Layout showSidebar showFooter={false}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            Reports from Doctors
          </h1>
          <p className="text-muted-foreground mt-2">
            View medical reports and prescriptions sent by your healthcare providers
          </p>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="mt-3">
              {unreadCount} unread report{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground">
                When your doctors send you reports, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card 
                key={report.id} 
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !report.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => handleViewReport(report)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!report.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Dr. {report.doctor_profile?.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.created_at), "MMM d, yyyy")}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getReportTypeColor(report.report_type)}>
                      {report.report_type.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.doctor_remarks && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {report.doctor_remarks}
                    </p>
                  )}
                  {report.risk_indicators && report.risk_indicators.length > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Contains risk indicators</span>
                    </div>
                  )}
                  {report.follow_up_advice && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Follow-up advice included</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report Detail Dialog */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedReport && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedReport.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Doctor Info */}
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Dr. {selectedReport.doctor_profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.doctor_profile?.specialization}
                      </p>
                      {selectedReport.doctor_profile?.hospital_affiliation && (
                        <p className="text-sm text-muted-foreground">
                          {selectedReport.doctor_profile.hospital_affiliation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Report Type</span>
                      <p className="font-medium capitalize">{selectedReport.report_type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Sent</span>
                      <p className="font-medium">{format(new Date(selectedReport.created_at), "PPP")}</p>
                    </div>
                    {selectedReport.examination_date && (
                      <div>
                        <span className="text-muted-foreground">Examination Date</span>
                        <p className="font-medium">{format(new Date(selectedReport.examination_date), "PPP")}</p>
                      </div>
                    )}
                  </div>

                  {/* Observations */}
                  {selectedReport.observations && (
                    <div>
                      <h4 className="font-medium mb-2">Observations</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {selectedReport.observations}
                      </p>
                    </div>
                  )}

                  {/* Doctor Remarks */}
                  {selectedReport.doctor_remarks && (
                    <div>
                      <h4 className="font-medium mb-2">Doctor's Remarks</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {selectedReport.doctor_remarks}
                      </p>
                    </div>
                  )}

                  {/* Risk Indicators */}
                  {selectedReport.risk_indicators && selectedReport.risk_indicators.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Indicators
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                        {selectedReport.risk_indicators.map((indicator, i) => (
                          <li key={i}>{indicator}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up Advice */}
                  {selectedReport.follow_up_advice && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        Follow-up Advice
                      </h4>
                      <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                        {selectedReport.follow_up_advice}
                      </p>
                    </div>
                  )}

                  {/* File Download */}
                  {signedUrl && (
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={signedUrl} download={selectedReport.file_name}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DoctorReportsInbox;
