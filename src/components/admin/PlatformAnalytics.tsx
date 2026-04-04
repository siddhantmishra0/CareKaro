import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, FileText, Activity, TrendingUp, Heart, 
  Brain, Eye, Droplets, Moon, Pill, Calendar
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PlatformStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  totalReports: number;
  reportsThisWeek: number;
  totalHealthChecks: number;
}

interface ReportTypeDistribution {
  name: string;
  value: number;
  color: string;
}

interface DailyActivity {
  date: string;
  reports: number;
  healthTools: number;
  users: number;
}

interface HealthToolUsage {
  tool: string;
  count: number;
  icon: React.ElementType;
}

const REPORT_TYPE_COLORS: Record<string, string> = {
  blood_test: "#dc2626",
  ecg: "#059669",
  xray: "#2563eb",
  mri: "#7c3aed",
  ct_scan: "#ea580c",
  ultrasound: "#0891b2",
  other: "#6b7280",
};

const HEALTH_TOOL_ICONS: Record<string, React.ElementType> = {
  blood_pressure: Heart,
  mental_health: Brain,
  vision: Eye,
  water: Droplets,
  sleep: Moon,
  medication: Pill,
  period: Calendar,
  fitness: Activity,
};

const PlatformAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7");
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeek: 0,
    totalReports: 0,
    reportsThisWeek: 0,
    totalHealthChecks: 0,
  });
  const [reportTypes, setReportTypes] = useState<ReportTypeDistribution[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [healthToolUsage, setHealthToolUsage] = useState<HealthToolUsage[]>([]);
  const [topConditions, setTopConditions] = useState<{ condition: string; count: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch basic stats in parallel
      const [
        profilesResult,
        reportsResult,
        auditResult,
        healthAssessmentsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('user_id, created_at', { count: 'exact' }),
        supabase.from('medical_reports').select('id, report_type, created_at, key_findings', { count: 'exact' }),
        supabase.from('audit_logs').select('id, user_id, action_type, action_category, created_at'),
        supabase.from('health_assessments').select('id, assessment_type, created_at', { count: 'exact' }),
      ]);

      // Calculate stats
      const todayStart = startOfDay(new Date()).toISOString();
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();

      const activeToday = new Set(
        auditResult.data?.filter(a => a.created_at >= todayStart).map(a => a.user_id) || []
      ).size;

      const activeWeek = new Set(
        auditResult.data?.filter(a => a.created_at >= weekStart).map(a => a.user_id) || []
      ).size;

      const reportsThisWeek = reportsResult.data?.filter(r => r.created_at >= weekStart).length || 0;

      setStats({
        totalUsers: profilesResult.count || 0,
        activeUsersToday: activeToday,
        activeUsersWeek: activeWeek,
        totalReports: reportsResult.count || 0,
        reportsThisWeek,
        totalHealthChecks: healthAssessmentsResult.count || 0,
      });

      // Report type distribution
      const reportTypeCounts: Record<string, number> = {};
      reportsResult.data?.forEach(r => {
        reportTypeCounts[r.report_type] = (reportTypeCounts[r.report_type] || 0) + 1;
      });

      setReportTypes(
        Object.entries(reportTypeCounts).map(([name, value]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value,
          color: REPORT_TYPE_COLORS[name] || "#6b7280",
        }))
      );

      // Daily activity for chart
      const activityByDay: Record<string, DailyActivity> = {};
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        activityByDay[date] = { date: format(subDays(new Date(), i), 'MMM dd'), reports: 0, healthTools: 0, users: 0 };
      }

      reportsResult.data?.forEach(r => {
        const date = format(new Date(r.created_at), 'yyyy-MM-dd');
        if (activityByDay[date]) activityByDay[date].reports++;
      });

      auditResult.data?.forEach(a => {
        const date = format(new Date(a.created_at), 'yyyy-MM-dd');
        if (activityByDay[date]) {
          if (a.action_category === 'user_activity' || a.action_type.includes('health_tool')) {
            activityByDay[date].healthTools++;
          }
        }
      });

      // Count unique users per day
      const usersByDay: Record<string, Set<string>> = {};
      auditResult.data?.forEach(a => {
        const date = format(new Date(a.created_at), 'yyyy-MM-dd');
        if (!usersByDay[date]) usersByDay[date] = new Set();
        usersByDay[date].add(a.user_id);
      });
      Object.entries(usersByDay).forEach(([date, users]) => {
        if (activityByDay[date]) activityByDay[date].users = users.size;
      });

      setDailyActivity(Object.values(activityByDay));

      // Health tool usage from various tables
      const [bpResult, sleepResult, waterResult, mentalResult, fitnessResult] = await Promise.all([
        supabase.from('blood_pressure_records').select('id', { count: 'exact' }).gte('created_at', startDate.toISOString()),
        supabase.from('sleep_records').select('id', { count: 'exact' }).gte('created_at', startDate.toISOString()),
        supabase.from('water_records').select('id', { count: 'exact' }).gte('created_at', startDate.toISOString()),
        supabase.from('mental_health_checkins').select('id', { count: 'exact' }).gte('created_at', startDate.toISOString()),
        supabase.from('fitness_records').select('id', { count: 'exact' }).gte('created_at', startDate.toISOString()),
      ]);

      setHealthToolUsage([
        { tool: 'Blood Pressure', count: bpResult.count || 0, icon: Heart },
        { tool: 'Sleep Tracking', count: sleepResult.count || 0, icon: Moon },
        { tool: 'Water Intake', count: waterResult.count || 0, icon: Droplets },
        { tool: 'Mental Health', count: mentalResult.count || 0, icon: Brain },
        { tool: 'Fitness', count: fitnessResult.count || 0, icon: Activity },
      ].sort((a, b) => b.count - a.count));

      // Extract common conditions from key findings
      const conditionCounts: Record<string, number> = {};
      reportsResult.data?.forEach(r => {
        if (r.key_findings && Array.isArray(r.key_findings)) {
          r.key_findings.forEach((finding: string) => {
            const condition = finding.toLowerCase();
            if (condition.includes('cholesterol')) conditionCounts['High Cholesterol'] = (conditionCounts['High Cholesterol'] || 0) + 1;
            if (condition.includes('glucose') || condition.includes('diabetes')) conditionCounts['Blood Sugar Issues'] = (conditionCounts['Blood Sugar Issues'] || 0) + 1;
            if (condition.includes('blood pressure') || condition.includes('hypertension')) conditionCounts['Hypertension'] = (conditionCounts['Hypertension'] || 0) + 1;
            if (condition.includes('vitamin')) conditionCounts['Vitamin Deficiency'] = (conditionCounts['Vitamin Deficiency'] || 0) + 1;
            if (condition.includes('anemia') || condition.includes('iron')) conditionCounts['Anemia/Iron Deficiency'] = (conditionCounts['Anemia/Iron Deficiency'] || 0) + 1;
            if (condition.includes('thyroid')) conditionCounts['Thyroid Issues'] = (conditionCounts['Thyroid Issues'] || 0) + 1;
          });
        }
      });

      setTopConditions(
        Object.entries(conditionCounts)
          .map(([condition, count]) => ({ condition, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      );

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground">Usage statistics, trends, and health insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Total Users
            </CardDescription>
            <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3 w-3" /> Active Today
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.activeUsersToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Active This Week
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.activeUsersWeek}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Total Reports
            </CardDescription>
            <CardTitle className="text-2xl">{stats.totalReports}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Reports This Week
            </CardDescription>
            <CardTitle className="text-2xl text-purple-600">{stats.reportsThisWeek}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> Health Checks
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.totalHealthChecks}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Trend</CardTitle>
            <CardDescription>Reports, health tools usage, and active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} name="Active Users" />
                <Area type="monotone" dataKey="reports" stackId="2" stroke="#059669" fill="#059669" fillOpacity={0.3} name="Reports" />
                <Area type="monotone" dataKey="healthTools" stackId="3" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Health Tools" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Report Types Distribution</CardTitle>
            <CardDescription>Breakdown of medical report categories</CardDescription>
          </CardHeader>
          <CardContent>
            {reportTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No report data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Health Tool Usage</CardTitle>
            <CardDescription>Most used health tracking features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthToolUsage.map((tool, index) => {
                const Icon = tool.icon;
                const maxCount = Math.max(...healthToolUsage.map(t => t.count), 1);
                const percentage = (tool.count / maxCount) * 100;
                return (
                  <div key={tool.tool} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{tool.tool}</span>
                        <Badge variant="secondary">{tool.count}</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {healthToolUsage.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No health tool usage data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Common Health Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Common Health Conditions</CardTitle>
            <CardDescription>Frequently detected conditions from report analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {topConditions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topConditions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="condition" type="category" width={130} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No health condition data available</p>
                  <p className="text-sm">Data will appear as reports are analyzed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Insights</CardTitle>
          <CardDescription>Key observations from platform usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">User Engagement</h4>
              <p className="text-sm text-muted-foreground">
                {stats.activeUsersWeek > 0 
                  ? `${((stats.activeUsersWeek / stats.totalUsers) * 100).toFixed(1)}% of users active this week`
                  : "No activity data yet"}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Report Upload Rate</h4>
              <p className="text-sm text-muted-foreground">
                {stats.reportsThisWeek > 0 
                  ? `${(stats.reportsThisWeek / 7).toFixed(1)} reports per day on average`
                  : "No reports this week"}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Most Popular Tool</h4>
              <p className="text-sm text-muted-foreground">
                {healthToolUsage.length > 0 
                  ? `${healthToolUsage[0].tool} with ${healthToolUsage[0].count} entries`
                  : "No health tool usage yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAnalytics;