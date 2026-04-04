import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { familyService, FamilyConnection } from "@/services/familyService";
import { Shield, Activity, Pill, AlertTriangle, Loader2, Save, Users } from "lucide-react";

const FamilyPreferences = () => {
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<FamilyConnection>>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await familyService.getConnections();
      // Filter to connections where current user is the member (can control their own sharing)
      setConnections(data.filter(c => !c.is_inviter));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (connectionId: string, field: keyof FamilyConnection, value: boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        [field]: value,
      }
    }));
  };

  const getEffectiveValue = (connection: FamilyConnection, field: keyof FamilyConnection): boolean => {
    if (pendingChanges[connection.id]?.[field] !== undefined) {
      return pendingChanges[connection.id][field] as boolean;
    }
    return connection[field] as boolean;
  };

  const saveChanges = async (connectionId: string) => {
    const changes = pendingChanges[connectionId];
    if (!changes) return;

    setSaving(connectionId);
    try {
      await familyService.updatePermissions(connectionId, {
        share_vitals: changes.share_vitals,
        allow_medicine_management: changes.allow_medicine_management,
        emergency_alerts: changes.emergency_alerts,
      });
      
      // Update local state
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, ...changes } : c
      ));
      
      // Clear pending changes
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[connectionId];
        return newChanges;
      });

      toast({
        title: "Saved",
        description: "Your sharing preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/family" className="text-primary hover:underline text-sm">
          ← Back to Family Dashboard
        </Link>
      </div>

      <Card className="border-primary/20 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sharing Preferences</CardTitle>
              <CardDescription>Control what health information you share with family</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven't joined any family connections yet.
            </p>
            <Link to="/family/join">
              <Button>Enter Family Code</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Sharing with {connection.family_member_name}
                    </CardTitle>
                    <CardDescription>
                      Connected as family member
                    </CardDescription>
                  </div>
                  {pendingChanges[connection.id] && (
                    <Button 
                      size="sm" 
                      onClick={() => saveChanges(connection.id)}
                      disabled={saving === connection.id}
                    >
                      {saving === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Share Vitals */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor={`vitals-${connection.id}`} className="font-medium">
                        Share My Vitals
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow {connection.family_member_name} to view your health metrics
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`vitals-${connection.id}`}
                    checked={getEffectiveValue(connection, 'share_vitals')}
                    onCheckedChange={(checked) => handleToggle(connection.id, 'share_vitals', checked)}
                  />
                </div>

                {/* Medicine Management */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor={`medicine-${connection.id}`} className="font-medium">
                        Allow Medicine Management
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Let {connection.family_member_name} manage your medications
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`medicine-${connection.id}`}
                    checked={getEffectiveValue(connection, 'allow_medicine_management')}
                    onCheckedChange={(checked) => handleToggle(connection.id, 'allow_medicine_management', checked)}
                  />
                </div>

                {/* Emergency Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <Label htmlFor={`emergency-${connection.id}`} className="font-medium">
                        Emergency Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify {connection.family_member_name} of critical health events
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`emergency-${connection.id}`}
                    checked={getEffectiveValue(connection, 'emergency_alerts')}
                    onCheckedChange={(checked) => handleToggle(connection.id, 'emergency_alerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Privacy notice */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Your Privacy Matters</p>
            <p>
              These settings only affect what you share with family members who invited you. 
              Your data is never shared with anyone else. You can change these settings or 
              unlink from family members at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyPreferences;