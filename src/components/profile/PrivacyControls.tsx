import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface DataCounts {
  reports: number;
  healthMetrics: number;
  sleepRecords: number;
  waterRecords: number;
  bpRecords: number;
  medicationRecords: number;
  mentalHealthCheckins: number;
  periodRecords: number;
  fitnessRecords: number;
  weightRecords: number;
  testosteroneRecords: number;
  visionRecords: number;
  substanceRecords: number;
  libidoRecords: number;
  symptomAssessments: number;
  healthAssessments: number;
  kickRecords: number;
  contractionRecords: number;
  ovulationPredictions: number;
  notifications: number;
  familyConnections: number;
  totalRecords: number;
}

const PrivacyControls = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [dataCounts, setDataCounts] = useState<DataCounts | null>(null);

  const fetchDataCounts = async () => {
    if (!user?.id) return;
    
    setIsLoadingCounts(true);
    try {
      const [
        reportsResult,
        metricsResult,
        sleepResult,
        waterResult,
        bpResult,
        medicationResult,
        mentalHealthResult,
        periodResult,
        fitnessResult,
        weightResult,
        testosteroneResult,
        visionResult,
        substanceResult,
        libidoResult,
        symptomResult,
        healthAssessmentResult,
        kickResult,
        contractionResult,
        ovulationResult,
        notificationsResult,
        familyResult,
      ] = await Promise.all([
        supabase.from("medical_reports").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("health_metrics").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("sleep_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("water_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("blood_pressure_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("medication_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("mental_health_checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("period_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("fitness_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("weight_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("testosterone_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vision_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("substance_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("libido_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("symptom_assessments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("health_assessments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("kick_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("contraction_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("ovulation_predictions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("family_connections").select("id", { count: "exact", head: true }).or(`inviter_id.eq.${user.id},member_id.eq.${user.id}`),
      ]);

      const counts: DataCounts = {
        reports: reportsResult.count || 0,
        healthMetrics: metricsResult.count || 0,
        sleepRecords: sleepResult.count || 0,
        waterRecords: waterResult.count || 0,
        bpRecords: bpResult.count || 0,
        medicationRecords: medicationResult.count || 0,
        mentalHealthCheckins: mentalHealthResult.count || 0,
        periodRecords: periodResult.count || 0,
        fitnessRecords: fitnessResult.count || 0,
        weightRecords: weightResult.count || 0,
        testosteroneRecords: testosteroneResult.count || 0,
        visionRecords: visionResult.count || 0,
        substanceRecords: substanceResult.count || 0,
        libidoRecords: libidoResult.count || 0,
        symptomAssessments: symptomResult.count || 0,
        healthAssessments: healthAssessmentResult.count || 0,
        kickRecords: kickResult.count || 0,
        contractionRecords: contractionResult.count || 0,
        ovulationPredictions: ovulationResult.count || 0,
        notifications: notificationsResult.count || 0,
        familyConnections: familyResult.count || 0,
        totalRecords: 0,
      };
      
      counts.totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
      setDataCounts(counts);
    } catch (error) {
      console.error("Error fetching data counts:", error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      fetchDataCounts();
    } else {
      setConfirmText("");
      setDataCounts(null);
    }
  };

  const handleDownloadData = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No user session found.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Fetch all user data in parallel
      const [
        profileResult,
        reportsResult,
        metricsResult,
        notificationsResult,
        recommendationsResult,
        sleepResult,
        waterResult,
        bpResult,
        medicationResult,
        mentalHealthResult,
        periodResult,
        weightResult,
        fitnessResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("medical_reports").select("*").eq("user_id", user.id),
        supabase.from("health_metrics").select("*").eq("user_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id),
        supabase.from("specialist_recommendations").select("*").eq("user_id", user.id),
        supabase.from("sleep_records").select("*").eq("user_id", user.id),
        supabase.from("water_records").select("*").eq("user_id", user.id),
        supabase.from("blood_pressure_records").select("*").eq("user_id", user.id),
        supabase.from("medication_records").select("*").eq("user_id", user.id),
        supabase.from("mental_health_checkins").select("*").eq("user_id", user.id),
        supabase.from("period_records").select("*").eq("user_id", user.id),
        supabase.from("weight_records").select("*").eq("user_id", user.id),
        supabase.from("fitness_records").select("*").eq("user_id", user.id),
      ]);

      // Compile all data
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        profile: profileResult.data || [],
        medicalReports: reportsResult.data || [],
        healthMetrics: metricsResult.data || [],
        notifications: notificationsResult.data || [],
        specialistRecommendations: recommendationsResult.data || [],
        sleepRecords: sleepResult.data || [],
        waterRecords: waterResult.data || [],
        bloodPressureRecords: bpResult.data || [],
        medicationRecords: medicationResult.data || [],
        mentalHealthCheckins: mentalHealthResult.data || [],
        periodRecords: periodResult.data || [],
        weightRecords: weightResult.data || [],
        fitnessRecords: fitnessResult.data || [],
      };

      // Create and download JSON file
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carekaro_data_export_${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error: any) {
      console.error("Error downloading data:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "No user session found.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Call the edge function to delete the account completely
      // invoke edge function using supabase client – auth token is included automatically
      const { data: result, error } = await supabase.functions.invoke('delete-account', {
        // no body required for deletion, token proves identity
      });
      if (error) {
        throw error;
      }

      // Sign out locally
      await supabase.auth.signOut();

      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Redirect to home page
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
      setConfirmText("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Usage & Sharing</CardTitle>
          <CardDescription>Control how your health data is used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Anonymous Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve CareKaro by sharing anonymous usage data
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Training Data</Label>
              <p className="text-sm text-muted-foreground">
                Allow anonymized data to improve our AI models
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share with Healthcare Providers</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing reports with verified healthcare providers
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Download or delete your personal data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Download Your Data</h4>
            <p className="text-sm text-muted-foreground">
              Get a copy of all your health data, reports, and analyses
            </p>
            <Button variant="outline" onClick={handleDownloadData} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </p>
                      
                      {isLoadingCounts ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading data summary...</span>
                        </div>
                      ) : dataCounts ? (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                          <h4 className="font-medium text-foreground text-sm">Data to be deleted:</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {dataCounts.reports > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Medical Reports</span>
                                <span className="font-medium text-foreground">{dataCounts.reports}</span>
                              </div>
                            )}
                            {dataCounts.healthMetrics > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Health Metrics</span>
                                <span className="font-medium text-foreground">{dataCounts.healthMetrics}</span>
                              </div>
                            )}
                            {dataCounts.sleepRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sleep Records</span>
                                <span className="font-medium text-foreground">{dataCounts.sleepRecords}</span>
                              </div>
                            )}
                            {dataCounts.waterRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Water Records</span>
                                <span className="font-medium text-foreground">{dataCounts.waterRecords}</span>
                              </div>
                            )}
                            {dataCounts.bpRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Blood Pressure</span>
                                <span className="font-medium text-foreground">{dataCounts.bpRecords}</span>
                              </div>
                            )}
                            {dataCounts.medicationRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Medications</span>
                                <span className="font-medium text-foreground">{dataCounts.medicationRecords}</span>
                              </div>
                            )}
                            {dataCounts.mentalHealthCheckins > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Mental Health</span>
                                <span className="font-medium text-foreground">{dataCounts.mentalHealthCheckins}</span>
                              </div>
                            )}
                            {dataCounts.periodRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Period Records</span>
                                <span className="font-medium text-foreground">{dataCounts.periodRecords}</span>
                              </div>
                            )}
                            {dataCounts.fitnessRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fitness Records</span>
                                <span className="font-medium text-foreground">{dataCounts.fitnessRecords}</span>
                              </div>
                            )}
                            {dataCounts.weightRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight Records</span>
                                <span className="font-medium text-foreground">{dataCounts.weightRecords}</span>
                              </div>
                            )}
                            {dataCounts.testosteroneRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Testosterone Records</span>
                                <span className="font-medium text-foreground">{dataCounts.testosteroneRecords}</span>
                              </div>
                            )}
                            {dataCounts.visionRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Vision Records</span>
                                <span className="font-medium text-foreground">{dataCounts.visionRecords}</span>
                              </div>
                            )}
                            {dataCounts.substanceRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Substance Records</span>
                                <span className="font-medium text-foreground">{dataCounts.substanceRecords}</span>
                              </div>
                            )}
                            {dataCounts.libidoRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Libido Records</span>
                                <span className="font-medium text-foreground">{dataCounts.libidoRecords}</span>
                              </div>
                            )}
                            {dataCounts.symptomAssessments > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Symptom Assessments</span>
                                <span className="font-medium text-foreground">{dataCounts.symptomAssessments}</span>
                              </div>
                            )}
                            {dataCounts.healthAssessments > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Health Assessments</span>
                                <span className="font-medium text-foreground">{dataCounts.healthAssessments}</span>
                              </div>
                            )}
                            {dataCounts.kickRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Kick Records</span>
                                <span className="font-medium text-foreground">{dataCounts.kickRecords}</span>
                              </div>
                            )}
                            {dataCounts.contractionRecords > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Contraction Records</span>
                                <span className="font-medium text-foreground">{dataCounts.contractionRecords}</span>
                              </div>
                            )}
                            {dataCounts.ovulationPredictions > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ovulation Predictions</span>
                                <span className="font-medium text-foreground">{dataCounts.ovulationPredictions}</span>
                              </div>
                            )}
                            {dataCounts.notifications > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Notifications</span>
                                <span className="font-medium text-foreground">{dataCounts.notifications}</span>
                              </div>
                            )}
                            {dataCounts.familyConnections > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Family Links</span>
                                <span className="font-medium text-foreground">{dataCounts.familyConnections}</span>
                              </div>
                            )}
                          </div>
                          {dataCounts.totalRecords > 0 && (
                            <div className="pt-2 border-t border-destructive/20 flex justify-between text-sm font-medium">
                              <span className="text-foreground">Total Records</span>
                              <span className="text-destructive">{dataCounts.totalRecords}</span>
                            </div>
                          )}
                          {dataCounts.totalRecords === 0 && (
                            <p className="text-sm text-muted-foreground italic">No tracked data found.</p>
                          )}
                        </div>
                      ) : null}

                      <div className="pt-2">
                        <Label htmlFor="confirm-delete" className="text-foreground font-medium">
                          Type DELETE to confirm:
                        </Label>
                        <Input
                          id="confirm-delete"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="mt-2"
                          disabled={isDeleting}
                        />
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText !== "DELETE"}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Log</CardTitle>
          <CardDescription>Recent security activity on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Logged in from Chrome on Windows</p>
                <p className="text-muted-foreground">IP: 192.168.1.1</p>
              </div>
              <p className="text-muted-foreground">2 hours ago</p>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Password changed</p>
                <p className="text-muted-foreground">Security update</p>
              </div>
              <p className="text-muted-foreground">3 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyControls;
