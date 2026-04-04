import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/adminService";
import DoctorManagement from "@/components/admin/DoctorManagement";
import SpecialistManagement from "@/components/admin/SpecialistManagement";
import AuditLogs from "@/components/admin/AuditLogs";
import PlatformAnalytics from "@/components/admin/PlatformAnalytics";
import SuspiciousActivityPanel from "@/components/admin/SuspiciousActivityPanel";
// import AdminQuickActionsWidget from "@/components/dashboard/AdminQuickActionsWidget";
import AdminSystemHealthWidget from "@/components/dashboard/AdminSystemHealthWidget";
import AdminUserGrowthWidget from "@/components/dashboard/AdminUserGrowthWidget";
import { Mail, TrendingUp, AlertCircle, CheckCircle, Clock, Search, Filter, Stethoscope, UserCheck, Activity, BarChart3, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Set up realtime subscription for email logs
  useEffect(() => {
    const channel = supabase
      .channel('email-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_logs'
        },
        (payload) => {
          console.log('New email log received:', payload);
          
          const emailLog = payload.new as any;
          
          // Show toast notification
          toast({
            title: "New Email Sent",
            description: `${emailLog.email_type.replace(/_/g, ' ')} to ${emailLog.recipient_email}`,
            variant: emailLog.status === 'sent' ? 'default' : 'destructive',
          });
          
          // Invalidate all email-related queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ["email-stats"] });
          queryClient.invalidateQueries({ queryKey: ["email-logs"] });
          queryClient.invalidateQueries({ queryKey: ["email-analytics"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Fetch email statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["email-stats"],
    queryFn: () => adminService.getEmailStatsSummary(),
  });

  // Fetch email logs
  const { data: emailLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs", currentPage, emailTypeFilter, statusFilter],
    queryFn: () =>
      adminService.getEmailLogs({
        page: currentPage,
        perPage: 50,
        emailType: emailTypeFilter !== "all" ? emailTypeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Fetch email analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["email-analytics"],
    queryFn: () => adminService.getEmailAnalytics(),
  });

  // Prepare chart data
  const emailTypeData = [
    { name: "Critical Findings", value: stats?.criticalAlerts || 0, color: "#dc2626" },
    { name: "Report Complete", value: stats?.reportCompleted || 0, color: "#059669" },
    { name: "Follow-up Reminders", value: stats?.followUpReminders || 0, color: "#2563EB" },
  ];

  const statusData = [
    { name: "Successful", value: stats?.successfulEmails || 0, color: "#059669" },
    { name: "Failed", value: stats?.failedEmails || 0, color: "#dc2626" },
  ];

  // Prepare time series data
  const timeSeriesData = analytics
    ?.slice(0, 30)
    .reverse()
    .map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      sent: item.status === "sent" ? item.count : 0,
      failed: item.status === "failed" ? item.count : 0,
    })) || [];

  const filteredLogs = emailLogsData?.data.filter((log) =>
    searchQuery
      ? log.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <Layout showSidebar>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor email notifications, delivery status, and system analytics
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalEmails || 0}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <CheckCircle className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-accent">{stats?.successfulEmails || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalEmails
                        ? `${((stats.successfulEmails / stats.totalEmails) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-destructive">{stats?.failedEmails || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalEmails
                        ? `${((stats.failedEmails / stats.totalEmails) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                <TrendingUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.criticalAlerts || 0}</div>
                    <p className="text-xs text-muted-foreground">Requiring attention</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platform">
                <BarChart3 className="h-4 w-4 mr-1" />
                Platform Analytics
              </TabsTrigger>
              <TabsTrigger value="suspicious" className="text-red-600">
                <ShieldAlert className="h-4 w-4 mr-1" />
                Suspicious Activity
              </TabsTrigger>
              <TabsTrigger value="doctors">Doctors</TabsTrigger>
              <TabsTrigger value="specialists">Specialists</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="logs">Email Logs</TabsTrigger>
              <TabsTrigger value="analytics">Email Analytics</TabsTrigger>
            </TabsList>

            {/* Platform Analytics Tab */}
            <TabsContent value="platform">
              <PlatformAnalytics />
            </TabsContent>

            {/* Suspicious Activity Tab */}
            <TabsContent value="suspicious">
              <SuspiciousActivityPanel />
            </TabsContent>

            {/* Doctors Tab */}
            <TabsContent value="doctors">
              <DoctorManagement />
            </TabsContent>

            {/* Specialists Tab */}
            <TabsContent value="specialists">
              <SpecialistManagement />
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="audit">
              <AuditLogs />
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Admin Widget Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdminSystemHealthWidget />
                <AdminUserGrowthWidget />
                {/* <AdminQuickActionsWidget /> */}
              </div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Emails by Type</CardTitle>
                    <CardDescription>Distribution of email notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={emailTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {emailTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Status</CardTitle>
                    <CardDescription>Email delivery success rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#2563EB" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Notification History</CardTitle>
                  <CardDescription>Complete log of all email notifications sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Search by email or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Email Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="critical_finding">Critical Findings</SelectItem>
                        <SelectItem value="report_complete">Report Complete</SelectItem>
                        <SelectItem value="follow_up_reminder">Follow-up Reminders</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email Logs Table */}
                  {logsLoading ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredLogs && filteredLogs.length > 0 ? (
                    <div className="space-y-2">
                      {filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground truncate">{log.recipient_email}</p>
                              <Badge
                                variant={log.status === "sent" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {log.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {log.email_type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{log.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.sent_at), "MMM dd, yyyy 'at' HH:mm")}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No email logs found</p>
                  )}

                  {/* Pagination */}
                  {emailLogsData && emailLogsData.count > 50 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {Math.ceil(emailLogsData.count / 50)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= Math.ceil(emailLogsData.count / 50)}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Trends (Last 30 Days)</CardTitle>
                  <CardDescription>Daily email delivery trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-96 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke="#059669" name="Successful" />
                        <Line type="monotone" dataKey="failed" stroke="#dc2626" name="Failed" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
