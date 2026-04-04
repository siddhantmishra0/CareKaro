import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, XCircle, AlertTriangle, Search,
  User, Clock, Eye, ThumbsUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Recommendation {
  id: string;
  user_id: string;
  specialty: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  recommended_actions: string[] | null;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  report_id: string | null;
  created_at: string;
  patient_name?: string;
}

const SpecialistManagement = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'dismiss';
    recId: string;
  } | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch all recommendations
      const { data: recs, error } = await supabase
        .from('specialist_recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs and fetch their names
      const userIds = [...new Set(recs?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      const enrichedRecs = (recs || []).map(rec => ({
        ...rec,
        patient_name: profileMap.get(rec.user_id) || 'Unknown Patient'
      }));

      setRecommendations(enrichedRecs as Recommendation[]);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (recId: string, action: 'approve' | 'dismiss') => {
    try {
      if (action === 'approve') {
        // Mark as acknowledged
        const { error } = await supabase
          .from('specialist_recommendations')
          .update({ 
            is_acknowledged: true, 
            acknowledged_at: new Date().toISOString() 
          })
          .eq('id', recId);

        if (error) throw error;
        toast.success("Recommendation approved");
      } else {
        // Delete the recommendation
        const { error } = await supabase
          .from('specialist_recommendations')
          .delete()
          .eq('id', recId);

        if (error) throw error;
        toast.success("Recommendation dismissed");
      }

      // Refresh data
      fetchRecommendations();
    } catch (error) {
      console.error("Error updating recommendation:", error);
      toast.error("Failed to update recommendation");
    } finally {
      setConfirmDialog(null);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const filteredRecs = recommendations.filter(rec => {
    const matchesSearch = 
      rec.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reasoning.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUrgency = urgencyFilter === "all" || rec.urgency === urgencyFilter;
    
    return matchesSearch && matchesUrgency;
  });

  const pendingRecs = filteredRecs.filter(r => !r.is_acknowledged);
  const acknowledgedRecs = filteredRecs.filter(r => r.is_acknowledged);

  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(r => !r.is_acknowledged).length,
    critical: recommendations.filter(r => r.urgency === 'critical' && !r.is_acknowledged).length,
    approved: recommendations.filter(r => r.is_acknowledged).length,
  };

  if (loading) {
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
        <h2 className="text-2xl font-bold">Specialist Recommendations</h2>
        <p className="text-muted-foreground">Review and manage AI-generated specialist recommendations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Recommendations</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Urgency</CardDescription>
            <CardTitle className="text-3xl text-destructive">{stats.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, specialty, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {stats.pending > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingRecs.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending recommendations</p>
              </CardContent>
            </Card>
          ) : (
            pendingRecs.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.patient_name}</h3>
                          {getUrgencyBadge(rec.urgency)}
                        </div>
                        <p className="text-sm font-medium text-primary">{rec.specialty}</p>
                        <p className="text-sm text-muted-foreground mt-2">{rec.reasoning}</p>
                        
                        {rec.recommended_actions && rec.recommended_actions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Actions:</p>
                            <ul className="text-sm list-disc list-inside space-y-1">
                              {rec.recommended_actions.map((action, idx) => (
                                <li key={idx} className="text-muted-foreground">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Generated: {format(new Date(rec.created_at), "PPP 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setConfirmDialog({ open: true, action: 'approve', recId: rec.id })}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDialog({ open: true, action: 'dismiss', recId: rec.id })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-4">
          {acknowledgedRecs.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No approved recommendations yet</p>
              </CardContent>
            </Card>
          ) : (
            acknowledgedRecs.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.patient_name}</h3>
                          {getUrgencyBadge(rec.urgency)}
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" /> Approved
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-primary">{rec.specialty}</p>
                        <p className="text-sm text-muted-foreground mt-2">{rec.reasoning}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Approved: {rec.acknowledged_at ? format(new Date(rec.acknowledged_at), "PPP 'at' h:mm a") : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approve' ? 'Approve Recommendation' : 'Dismiss Recommendation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'approve' 
                ? 'Are you sure you want to approve this specialist recommendation? The patient will be notified.'
                : 'Are you sure you want to dismiss this recommendation? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => confirmDialog && handleAction(confirmDialog.recId, confirmDialog.action)}
            >
              {confirmDialog?.action === 'approve' ? 'Approve' : 'Dismiss'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SpecialistManagement;
