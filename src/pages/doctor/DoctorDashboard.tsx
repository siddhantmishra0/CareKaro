import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorProfile, DoctorReport } from "@/services/doctorService";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, FileText, Clock, Send, AlertCircle, 
  CheckCircle, Stethoscope, Plus, Copy, Check,
  TrendingUp, Eye, Calendar, Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DoctorQuickActionsWidget from "@/components/dashboard/DoctorQuickActionsWidget";
import DoctorCriticalAlertsWidget from "@/components/dashboard/DoctorCriticalAlertsWidget";
import DoctorPatientQueueWidget from "@/components/dashboard/DoctorPatientQueueWidget";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [reports, setReports] = useState<DoctorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

  const handleCopyDoctorId = async () => {
    if (doctorProfile?.doctor_id) {
      await navigator.clipboard.writeText(doctorProfile.doctor_id);
      setCopiedDoctorId(true);
      setTimeout(() => setCopiedDoctorId(false), 2000);
      toast.success("Doctor ID copied to clipboard");
    }
  };

  useEffect(() => {
    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const profile = await doctorService.getDoctorProfile(user.id);
      setDoctorProfile(profile);

      if (profile) {
        const doctorReports = await doctorService.getDoctorReports(profile.id);
        setReports(doctorReports);
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout showSidebar showFooter={false}>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!doctorProfile) {
    return (
      <Layout showSidebar showFooter={false}>
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Doctor Profile Not Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have a doctor account. Doctor accounts are created by administrators only.
                Please contact the platform administrator if you are a healthcare professional.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (doctorProfile.verification_status !== 'approved') {
    return (
      <Layout showSidebar showFooter={false}>
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-16 w-16 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {doctorProfile.verification_status === 'pending' 
                  ? "Verification Pending" 
                  : doctorProfile.verification_status === 'rejected'
                  ? "Verification Rejected"
                  : "Account Suspended"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {doctorProfile.verification_status === 'pending'
                  ? "Your doctor profile is being reviewed by our admin team. You'll be notified once approved."
                  : doctorProfile.verification_status === 'rejected'
                  ? "Your verification request was rejected. Please contact support for more information."
                  : "Your account has been suspended. Please contact support."}
              </p>
              <Badge variant={
                doctorProfile.verification_status === 'pending' ? 'secondary' : 'destructive'
              }>
                {doctorProfile.verification_status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate stats
  const totalReports = reports.length;
  const uniquePatients = new Set(reports.map(r => r.patient_id)).size;
  
  const todayReports = reports.filter(r => 
    format(new Date(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const weekReports = reports.filter(r => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(r.created_at) >= weekAgo;
  }).length;

  const monthReports = reports.filter(r => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(r.created_at) >= monthAgo;
  }).length;

  const readReports = reports.filter(r => r.is_read).length;
  const readRate = totalReports > 0 ? Math.round((readReports / totalReports) * 100) : 0;

  const pendingFollowUps = reports.filter(r => 
    r.follow_up_advice && !r.is_read
  ).length;

  const criticalReports = reports.filter(r => 
    r.risk_indicators && r.risk_indicators.length > 0
  ).length;

  return (
    <Layout showSidebar showFooter={false}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              Doctor Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">
                Welcome back, Dr. {doctorProfile.full_name}
              </p>
              <Badge variant="outline" className="font-mono text-xs">
                {doctorProfile.doctor_id}
              </Badge>
            </div>
          </div>
          <Button onClick={() => navigate("/doctor/send-report")}>
            <Plus className="h-4 w-4 mr-2" />
            Send Report
          </Button>
        </div>

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patients</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {uniquePatients}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Unique patients served</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reports Sent</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {totalReports}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{monthReports} this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Read Rate</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                {readRate}%
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={readRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{readReports} of {totalReports} read</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Follow-ups</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-amber-500" />
                {pendingFollowUps}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Awaiting patient response</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today
              </CardDescription>
              <CardTitle className="text-2xl">{todayReports} reports</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                This Week
              </CardDescription>
              <CardTitle className="text-2xl">{weekReports} reports</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                This Month
              </CardDescription>
              <CardTitle className="text-2xl">{monthReports} reports</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                With Risk Indicators
              </CardDescription>
              <CardTitle className="text-2xl">{criticalReports} reports</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="recent" className="space-y-4">
              <TabsList>
                <TabsTrigger value="recent">Recent Reports</TabsTrigger>
                <TabsTrigger value="profile">My Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="recent">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reports Sent</CardTitle>
                    <CardDescription>Your most recent patient reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reports.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No reports sent yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => navigate("/doctor/send-report")}>
                          Send Your First Report
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.slice(0, 10).map((report) => (
                          <div 
                            key={report.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{report.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={report.is_read ? "secondary" : "outline"}>
                                {report.is_read ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" /> Read</>
                                ) : (
                                  "Unread"
                                )}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {report.report_type.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Profile</CardTitle>
                    <CardDescription>Your professional information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm text-muted-foreground">Full Name</label>
                        <p className="font-medium">Dr. {doctorProfile.full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Doctor ID</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                            {doctorProfile.doctor_id}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyDoctorId}
                          >
                            {copiedDoctorId ? (
                              <Check className="h-4 w-4 text-accent" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Share this ID with patients for identification
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Specialization</label>
                        <p className="font-medium">{doctorProfile.specialization}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">License Number</label>
                        <p className="font-medium">{doctorProfile.license_number}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Hospital/Clinic</label>
                        <p className="font-medium">{doctorProfile.hospital_affiliation || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Phone</label>
                        <p className="font-medium">{doctorProfile.phone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Verification Status</label>
                        <Badge variant="default" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>
                    {doctorProfile.bio && (
                      <div>
                        <label className="text-sm text-muted-foreground">Bio</label>
                        <p className="text-sm mt-1">{doctorProfile.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Sidebar with Doctor Widgets */}
          <div className="space-y-6">
            <DoctorQuickActionsWidget />
            <DoctorCriticalAlertsWidget />
            <DoctorPatientQueueWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
