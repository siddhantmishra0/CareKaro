import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, Search, Filter, FileText, Users, Share2, 
  Stethoscope, Shield, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, Bell
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  action_category: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  user_name?: string;
}

// Critical events that should trigger admin alerts
const CRITICAL_ACTION_TYPES = [
  'doctor_verification_changed',
  'report_shared',
  'family_connection_status_changed',
  'admin_role_assigned',
  'admin_role_revoked',
  'doctor_suspended',
  'bulk_data_export',
  'failed_login_attempt',
  'suspicious_access_pattern',
];

const SUSPICIOUS_PATTERNS = {
  maxReportsPerHour: 20,
  maxSharesPerHour: 10,
  maxFailedLogins: 5,
};

const ACTION_CATEGORY_ICONS: Record<string, React.ElementType> = {
  reports: FileText,
  doctor_interactions: Stethoscope,
  data_sharing: Share2,
  family_access: Users,
  admin_actions: Shield,
};

const ACTION_CATEGORY_COLORS: Record<string, string> = {
  reports: "bg-blue-500",
  doctor_interactions: "bg-green-500",
  data_sharing: "bg-purple-500",
  family_access: "bg-orange-500",
  admin_actions: "bg-red-500",
};

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [recentCriticalEvents, setRecentCriticalEvents] = useState<AuditLog[]>([]);
  const perPage = 50;

  const isCriticalEvent = useCallback((log: AuditLog): boolean => {
    return CRITICAL_ACTION_TYPES.includes(log.action_type) || 
           log.action_category === 'admin_actions';
  }, []);

  const handleNewAuditEvent = useCallback(async (payload: any) => {
    const newLog = payload.new as AuditLog;
    
    // Fetch user name for the new log
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', newLog.user_id)
      .single();
    
    const enrichedLog: AuditLog = {
      ...newLog,
      details: (typeof newLog.details === 'object' && newLog.details !== null && !Array.isArray(newLog.details)) 
        ? newLog.details as Record<string, unknown> 
        : null,
      user_name: profile?.display_name || 'Unknown User'
    };

    // Check if it's a critical event
    if (isCriticalEvent(enrichedLog)) {
      setRecentCriticalEvents(prev => [enrichedLog, ...prev].slice(0, 10));
      
      // Show toast notification for critical events
      toast.warning(
        `Critical Event: ${enrichedLog.action_type.replace(/_/g, ' ')}`,
        {
          description: `User: ${enrichedLog.user_name} • ${format(new Date(enrichedLog.created_at), 'h:mm:ss a')}`,
          duration: 10000,
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        }
      );
    }

    // Add to logs if on first page and no filters
    if (currentPage === 1 && categoryFilter === 'all') {
      setLogs(prev => [enrichedLog, ...prev.slice(0, perPage - 1)]);
      setTotalCount(prev => prev + 1);
    }
  }, [currentPage, categoryFilter, isCriticalEvent]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        handleNewAuditEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewAuditEvent]);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, categoryFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (categoryFilter !== "all") {
        query = query.eq('action_category', categoryFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user names for the logs
      const userIds = [...new Set(data?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      const enrichedLogs: AuditLog[] = (data || []).map(log => ({
        ...log,
        details: (typeof log.details === 'object' && log.details !== null && !Array.isArray(log.details)) 
          ? log.details as Record<string, unknown> 
          : null,
        user_name: profileMap.get(log.user_id) || 'Unknown User'
      }));

      setLogs(enrichedLogs);
      setTotalCount(count || 0);
      
      // Initialize recent critical events
      const criticalLogs = enrichedLogs.filter(isCriticalEvent);
      setRecentCriticalEvents(criticalLogs.slice(0, 10));
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    searchQuery
      ? log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const formatActionType = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getCategoryIcon = (category: string) => {
    const Icon = ACTION_CATEGORY_ICONS[category] || Activity;
    return Icon;
  };

  const getCategoryBadgeClass = (category: string) => {
    return ACTION_CATEGORY_COLORS[category] || "bg-gray-500";
  };

  const stats = {
    total: totalCount,
    reports: logs.filter(l => l.action_category === 'reports').length,
    doctorInteractions: logs.filter(l => l.action_category === 'doctor_interactions').length,
    dataSharing: logs.filter(l => l.action_category === 'data_sharing').length,
    familyAccess: logs.filter(l => l.action_category === 'family_access').length,
  };

  const totalPages = Math.ceil(totalCount / perPage);

  if (loading && logs.length === 0) {
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
        <h2 className="text-2xl font-bold">Activity & Audit Logs</h2>
        <p className="text-muted-foreground">Track user actions, doctor interactions, and access patterns for compliance</p>
      </div>

      {/* Critical Events Alert Panel */}
      {recentCriticalEvents.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-700 dark:text-amber-400">Critical Events Monitor</CardTitle>
              <Badge variant="destructive" className="ml-auto">
                <Bell className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <CardDescription>Recent security-sensitive and admin actions requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentCriticalEvents.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center gap-3 p-2 bg-background/80 rounded-md border border-amber-200 dark:border-amber-800"
                >
                  <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.action_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user_name} • {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {log.action_category.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Report Actions</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.reports}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Doctor Interactions</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.doctorInteractions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Data Sharing</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.dataSharing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Family Access</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.familyAccess}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
            <SelectItem value="doctor_interactions">Doctor Interactions</SelectItem>
            <SelectItem value="data_sharing">Data Sharing</SelectItem>
            <SelectItem value="family_access">Family Access</SelectItem>
            <SelectItem value="admin_actions">Admin Actions</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchAuditLogs}>
          Refresh
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log History</CardTitle>
          <CardDescription>Complete log of all tracked actions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = getCategoryIcon(log.action_category);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getCategoryBadgeClass(log.action_category)}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{log.user_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatActionType(log.action_type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {log.action_category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {Object.entries(log.details).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), "PPP 'at' h:mm:ss a")}
                        {log.resource_type && (
                          <>
                            <span>•</span>
                            <span>{log.resource_type}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
