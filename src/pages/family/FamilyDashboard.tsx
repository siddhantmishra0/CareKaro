import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { familyService, FamilyConnection, MemberHealthData } from "@/services/familyService";
import { 
  Users, UserPlus, Heart, Activity, Pill, Calendar, 
  Shield, Loader2, UserMinus, ChevronRight, Settings,
  AlertTriangle, Clock
} from "lucide-react";
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
import { format } from "date-fns";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";
import Layout from "@/components/layout/Layout";

const FamilyDashboard = () => {
  const { canAccess, getRequiredPlan, isLoading: subLoading } = useSubscription();
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyConnection | null>(null);
  const [memberHealth, setMemberHealth] = useState<MemberHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await familyService.getConnections();
      setConnections(data);
      if (data.length > 0 && !selectedMember) {
        setSelectedMember(data[0]);
        loadMemberHealth(data[0].family_member_id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load family connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMemberHealth = async (memberId: string) => {
    setLoadingHealth(true);
    setMemberHealth(null);
    try {
      const data = await familyService.getMemberHealth(memberId);
      setMemberHealth(data);
    } catch (error: any) {
      if (error.message.includes('disabled')) {
        toast({
          title: "Sharing Disabled",
          description: "This family member has disabled vital sharing.",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load health data",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleSelectMember = (connection: FamilyConnection) => {
    setSelectedMember(connection);
    loadMemberHealth(connection.family_member_id);
  };

  const handleUnlink = async () => {
    if (!unlinkingId) return;
    try {
      await familyService.unlinkMember(unlinkingId);
      toast({
        title: "Unlinked",
        description: "Family member has been unlinked successfully.",
      });
      setConnections(prev => prev.filter(c => c.id !== unlinkingId));
      if (selectedMember?.id === unlinkingId) {
        setSelectedMember(null);
        setMemberHealth(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink member",
        variant: "destructive",
      });
    } finally {
      setUnlinkingId(null);
      setShowUnlinkDialog(false);
    }
  };

  if (!subLoading && !canAccess("family")) {
    return (
      <Layout showSidebar>
        <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Family Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage family member health profiles</p>
          </div>
          <UpgradePrompt
            feature="Family Dashboard"
            requiredPlan={getRequiredPlan("family")}
            description="Add up to 5 family members, share health dashboards, and track family-wide health trends."
          />
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-10 w-10 text-primary" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">No Family Connections Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect with your family members to share health updates and stay informed about each other's well-being.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={() => navigate('/family/add')} size="lg" className="min-w-[200px]">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Family Member
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/family/join')} 
                size="lg"
                className="min-w-[200px]"
              >
                Enter Family Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Family Dashboard</h1>
          <p className="text-muted-foreground">Monitor your family's health and well-being</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/family/join')}>
            Enter Code
          </Button>
          <Button onClick={() => navigate('/family/add')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Family members list */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {connections.map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => handleSelectMember(connection)}
                  className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                    selectedMember?.id === connection.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{connection.family_member_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected {format(new Date(connection.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                My Sharing Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/family/preferences')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Manage What I Share
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMember && (
            <>
              {/* Member header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Heart className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{selectedMember.family_member_name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {memberHealth?.profile?.blood_group && (
                            <Badge variant="secondary" className="mr-2">
                              Blood: {memberHealth.profile.blood_group}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setUnlinkingId(selectedMember.id);
                        setShowUnlinkDialog(true);
                      }}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unlink
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loadingHealth ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : memberHealth ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Latest vitals */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Latest Vitals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memberHealth.health_metrics.length > 0 ? (
                        <div className="space-y-3">
                          {memberHealth.health_metrics.slice(0, 4).map((metric) => (
                            <div key={metric.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-sm capitalize">
                                {metric.metric_name.replace(/_/g, ' ')}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${metric.is_abnormal ? 'text-destructive' : ''}`}>
                                  {metric.metric_value} {metric.metric_unit}
                                </span>
                                {metric.is_abnormal && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No vitals recorded yet
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Today's medications */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" />
                        Today's Medicines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memberHealth.medications.length > 0 ? (
                        <div className="space-y-3">
                          {memberHealth.medications.slice(0, 4).map((med) => (
                            <div key={med.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium">{med.medication_name}</span>
                              <span className="text-xs text-muted-foreground">{med.dosage}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No medications logged today
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Permissions info */}
                  <Card className="sm:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Sharing Permissions
                      </CardTitle>
                      <CardDescription>
                        What {selectedMember.family_member_name} shares with you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className={`p-3 rounded-lg ${memberHealth.permissions.share_vitals ? 'bg-green-50 border border-green-200' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2">
                            <Activity className={`h-4 w-4 ${memberHealth.permissions.share_vitals ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Vitals</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {memberHealth.permissions.share_vitals ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${memberHealth.permissions.allow_medicine_management ? 'bg-green-50 border border-green-200' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2">
                            <Pill className={`h-4 w-4 ${memberHealth.permissions.allow_medicine_management ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Medicines</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {memberHealth.permissions.allow_medicine_management ? 'Can manage' : 'View only'}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${memberHealth.permissions.emergency_alerts ? 'bg-green-50 border border-green-200' : 'bg-muted'}`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${memberHealth.permissions.emergency_alerts ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Emergency Alerts</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {memberHealth.permissions.emergency_alerts ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Unable to load health data. This member may have disabled sharing.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Family Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your connection with {selectedMember?.family_member_name}. 
              You will no longer be able to see each other's health updates. 
              You can reconnect later with a new invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FamilyDashboard;