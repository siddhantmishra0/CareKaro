import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Loader2, Calendar, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportPeriodRecords } from "@/lib/exportHealth";

const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Bloating",
  "Fatigue",
  "Mood swings",
  "Back pain",
  "Breast tenderness",
  "Nausea",
];

interface PeriodRecord {
  id: string;
  start_date: string;
  end_date: string | null;
  flow_intensity: string | null;
  symptoms: string[] | null;
  notes: string | null;
}

interface OvulationPrediction {
  predicted_ovulation_date: string;
  fertile_window_start: string;
  fertile_window_end: string;
  next_period_date: string;
  cycle_notes?: string;
}

export function PeriodTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flowIntensity, setFlowIntensity] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodDuration, setPeriodDuration] = useState("5");
  const [isGettingPrediction, setIsGettingPrediction] = useState(false);
  const [prediction, setPrediction] = useState<OvulationPrediction | null>(null);

  const { data: periodRecords } = useQuery({
    queryKey: ["period-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("period_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_date", { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data as PeriodRecord[];
    },
    enabled: !!user?.id,
  });

  const { data: latestPrediction } = useQuery({
    queryKey: ["ovulation-predictions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ovulation_predictions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const savePeriodMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !startDate) throw new Error("Missing data");
      
      const { error } = await supabase.from("period_records").insert({
        user_id: user.id,
        start_date: startDate,
        end_date: endDate || null,
        flow_intensity: flowIntensity || null,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
        notes: notes || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["period-records"] });
      toast.success("Period logged successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to log period");
      console.error(error);
    },
  });

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    setFlowIntensity("");
    setSelectedSymptoms([]);
    setNotes("");
  };

  const getPrediction = async () => {
    if (!user?.id) return;
    
    const lastPeriod = periodRecords?.[0]?.start_date;
    if (!lastPeriod) {
      toast.error("Please log at least one period first");
      return;
    }

    setIsGettingPrediction(true);
    setPrediction(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "ovulation_prediction",
          userId: user.id,
          data: {
            lastPeriodStart: lastPeriod,
            cycleLength: parseInt(cycleLength),
            periodDuration: parseInt(periodDuration),
          },
        },
      });

      if (error) throw error;

      setPrediction(data);
      queryClient.invalidateQueries({ queryKey: ["ovulation-predictions"] });
      toast.success("Prediction generated!");
    } catch (error) {
      console.error("Error getting prediction:", error);
      toast.error("Failed to generate prediction");
    } finally {
      setIsGettingPrediction(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  // Calculate cycle lengths for trends
  const cycleLengthData = periodRecords && periodRecords.length >= 2
    ? [...periodRecords]
        .slice(0, -1)
        .map((record, index) => {
          const nextRecord = periodRecords[index + 1];
          const start = new Date(record.start_date);
          const prevStart = new Date(nextRecord.start_date);
          const daysDiff = Math.round((start.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
          return {
            date: record.start_date,
            value: daysDiff,
          };
        })
        .reverse()
    : [];

  // Calculate period duration for trends
  const periodDurationData = periodRecords
    ? periodRecords
        .filter((r) => r.end_date)
        .map((record) => {
          const start = new Date(record.start_date);
          const end = new Date(record.end_date!);
          const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return {
            date: record.start_date,
            value: days,
          };
        })
        .reverse()
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Period & Menstrual Tracker</h3>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Accurate cycle tracking with predictions</p>
              {latestPrediction && (
                <p className="text-xs text-accent mt-1">
                  Next period: {formatDate(latestPrediction.next_period_date)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-accent" />
              Period & Ovulation Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportPeriodRecords(periodRecords || [])}
              disabled={!periodRecords?.length}
            />
          </div>
          <DialogDescription>
            Track your menstrual cycle and get AI-powered predictions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log Period</TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="predict">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Period Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Period End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Flow Intensity</Label>
              <Select value={flowIntensity} onValueChange={setFlowIntensity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flow intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <label htmlFor={symptom} className="text-sm cursor-pointer">
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => savePeriodMutation.mutate()} 
              disabled={!startDate || savePeriodMutation.isPending}
              className="w-full"
            >
              {savePeriodMutation.isPending ? "Saving..." : "Log Period"}
            </Button>

            {/* Period History */}
            {periodRecords && periodRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Recent Cycles</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {periodRecords.slice(0, 6).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(record.start_date)}
                          {record.end_date && ` - ${formatDate(record.end_date)}`}
                        </p>
                        {record.flow_intensity && (
                          <p className="text-xs text-muted-foreground capitalize">{record.flow_intensity} flow</p>
                        )}
                      </div>
                      {record.symptoms && record.symptoms.length > 0 && (
                        <Badge variant="outline">{record.symptoms.length} symptoms</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {cycleLengthData.length > 0 || periodDurationData.length > 0 ? (
              <>
                {cycleLengthData.length > 0 && (
                  <MiniTrendChart
                    data={cycleLengthData}
                    title="Cycle Length (days)"
                    unit=" days"
                    color="hsl(var(--accent))"
                    height={180}
                  />
                )}
                {periodDurationData.length > 0 && (
                  <MiniTrendChart
                    data={periodDurationData}
                    title="Period Duration (days)"
                    unit=" days"
                    color="hsl(262, 83%, 58%)"
                    height={180}
                  />
                )}
                {cycleLengthData.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-2">Cycle Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Average Cycle</p>
                          <p className="text-xl font-bold text-foreground">
                            {Math.round(cycleLengthData.reduce((sum, d) => sum + d.value, 0) / cycleLengthData.length)} days
                          </p>
                        </div>
                        {periodDurationData.length > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Average Period</p>
                            <p className="text-xl font-bold text-foreground">
                              {Math.round(periodDurationData.reduce((sum, d) => sum + d.value, 0) / periodDurationData.length)} days
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Log at least 2 periods to see cycle trends
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="predict" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycleLength">Average Cycle Length (days)</Label>
                <Input
                  id="cycleLength"
                  type="number"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodDuration">Average Period Duration (days)</Label>
                <Input
                  id="periodDuration"
                  type="number"
                  value={periodDuration}
                  onChange={(e) => setPeriodDuration(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={getPrediction} 
              disabled={isGettingPrediction || !periodRecords?.length}
              className="w-full"
            >
              {isGettingPrediction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Predictions
                </>
              )}
            </Button>

            {(prediction || latestPrediction) && (
              <Card className="bg-accent/10 border-accent/30">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    Your Predictions
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-xs text-muted-foreground">Ovulation Date</p>
                      <p className="text-lg font-bold text-accent">
                        {formatDate((prediction || latestPrediction)!.predicted_ovulation_date)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-xs text-muted-foreground">Next Period</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatDate((prediction || latestPrediction)!.next_period_date)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Fertile Window</p>
                    <p className="text-sm font-medium text-green-600">
                      {formatDate((prediction || latestPrediction)!.fertile_window_start)} - {formatDate((prediction || latestPrediction)!.fertile_window_end)}
                    </p>
                  </div>

                  {(prediction?.cycle_notes || latestPrediction?.ai_notes) && (
                    <p className="text-sm text-muted-foreground">
                      {prediction?.cycle_notes || latestPrediction?.ai_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {!periodRecords?.length && (
              <p className="text-sm text-muted-foreground text-center">
                Log at least one period to get predictions
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}