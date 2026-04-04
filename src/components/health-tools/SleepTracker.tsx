import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bed, Loader2, Moon, Sun, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportSleepRecords } from "@/lib/exportHealth";

interface SleepRecord {
  id: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality_rating: number | null;
  interruptions: number;
  notes: string | null;
}

export function SleepTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().split("T")[0]);
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [qualityRating, setQualityRating] = useState([3]);
  const [interruptions, setInterruptions] = useState("0");
  const [notes, setNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const { data: sleepRecords } = useQuery({
    queryKey: ["sleep-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sleep_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("sleep_date", { ascending: false })
        .limit(14);
      
      if (error) throw error;
      return data as SleepRecord[];
    },
    enabled: !!user?.id,
  });

  const calculateDuration = () => {
    if (!bedtime || !wakeTime) return null;
    
    const [bedHour, bedMin] = bedtime.split(":").map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number);
    
    let bedMins = bedHour * 60 + bedMin;
    let wakeMins = wakeHour * 60 + wakeMin;
    
    if (wakeMins < bedMins) {
      wakeMins += 24 * 60; // Next day
    }
    
    return Math.round((wakeMins - bedMins) / 60 * 10) / 10;
  };

  const saveSleepMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !sleepDate) throw new Error("Missing data");
      
      const duration = calculateDuration();
      
      const { error } = await supabase.from("sleep_records").insert({
        user_id: user.id,
        sleep_date: sleepDate,
        bedtime: bedtime || null,
        wake_time: wakeTime || null,
        duration_hours: duration,
        quality_rating: qualityRating[0],
        interruptions: parseInt(interruptions) || 0,
        notes: notes || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-records"] });
      toast.success("Sleep record saved!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save sleep record");
      console.error(error);
    },
  });

  const resetForm = () => {
    setSleepDate(new Date().toISOString().split("T")[0]);
    setBedtime("");
    setWakeTime("");
    setQualityRating([3]);
    setInterruptions("0");
    setNotes("");
  };

  const getAnalysis = async () => {
    if (!user?.id) return;
    
    if (!sleepRecords || sleepRecords.length < 3) {
      toast.error("Log at least 3 days of sleep for analysis");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "sleep_analysis",
          userId: user.id,
          data: {},
        },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error getting analysis:", error);
      toast.error("Failed to analyze sleep data");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getQualityLabel = (rating: number) => {
    if (rating <= 1) return "Poor";
    if (rating <= 2) return "Fair";
    if (rating <= 3) return "Good";
    if (rating <= 4) return "Very Good";
    return "Excellent";
  };

  const getQualityColor = (rating: number) => {
    if (rating <= 1) return "text-red-500";
    if (rating <= 2) return "text-orange-500";
    if (rating <= 3) return "text-yellow-500";
    if (rating <= 4) return "text-green-500";
    return "text-emerald-500";
  };

  const averageDuration = sleepRecords?.length
    ? Math.round(sleepRecords.reduce((sum, r) => sum + (r.duration_hours || 0), 0) / sleepRecords.length * 10) / 10
    : null;

  const averageQuality = sleepRecords?.length
    ? Math.round(sleepRecords.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / sleepRecords.length * 10) / 10
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Bed className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Sleep Quality Tracker</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monitor sleep patterns</p>
              {averageDuration && (
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {averageDuration}h sleep
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
              <Bed className="h-5 w-5 text-primary" />
              Sleep Quality Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportSleepRecords(sleepRecords || [])}
              disabled={!sleepRecords?.length}
            />
          </div>
          <DialogDescription>
            Track your sleep patterns and get AI-powered insights
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log Sleep</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sleepDate">Date</Label>
              <Input
                id="sleepDate"
                type="date"
                value={sleepDate}
                onChange={(e) => setSleepDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedtime" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Bedtime
                </Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wakeTime" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Wake Time
                </Label>
                <Input
                  id="wakeTime"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>

            {bedtime && wakeTime && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Sleep Duration</p>
                <p className="text-2xl font-bold text-foreground">{calculateDuration()} hours</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Sleep Quality</Label>
                <span className={`text-sm font-medium ${getQualityColor(qualityRating[0])}`}>
                  {getQualityLabel(qualityRating[0])}
                </span>
              </div>
              <Slider value={qualityRating} onValueChange={setQualityRating} min={1} max={5} step={1} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interruptions">Number of Interruptions</Label>
              <Input
                id="interruptions"
                type="number"
                min="0"
                value={interruptions}
                onChange={(e) => setInterruptions(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Dreams, how you felt waking up, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button 
              onClick={() => saveSleepMutation.mutate()} 
              disabled={!sleepDate || saveSleepMutation.isPending}
              className="w-full"
            >
              {saveSleepMutation.isPending ? "Saving..." : "Log Sleep"}
            </Button>

            {/* Recent Sleep Records */}
            {sleepRecords && sleepRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Recent Sleep</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {sleepRecords.slice(0, 7).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(record.sleep_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.duration_hours ? `${record.duration_hours}h` : "Duration not logged"}
                        </p>
                      </div>
                      {record.quality_rating && (
                        <Badge variant="outline" className={getQualityColor(record.quality_rating)}>
                          {getQualityLabel(record.quality_rating)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {sleepRecords && sleepRecords.length > 0 ? (
              <>
                <MiniTrendChart
                  data={[...sleepRecords]
                    .filter((r) => r.duration_hours !== null)
                    .reverse()
                    .map((r) => ({
                      date: r.sleep_date,
                      value: r.duration_hours!,
                    }))}
                  title="Sleep Duration (hours)"
                  unit="h"
                  color="hsl(221, 83%, 53%)"
                  height={180}
                />
                <MiniTrendChart
                  data={[...sleepRecords]
                    .filter((r) => r.quality_rating !== null)
                    .reverse()
                    .map((r) => ({
                      date: r.sleep_date,
                      value: r.quality_rating!,
                    }))}
                  title="Sleep Quality (1-5)"
                  unit=""
                  color="hsl(262, 83%, 58%)"
                  height={180}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start logging your sleep to see trends over time
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {averageDuration && averageQuality && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Avg. Duration</p>
                    <p className="text-2xl font-bold text-foreground">{averageDuration}h</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Avg. Quality</p>
                    <p className={`text-2xl font-bold ${getQualityColor(averageQuality)}`}>
                      {getQualityLabel(Math.round(averageQuality))}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Button 
              onClick={getAnalysis} 
              disabled={isAnalyzing || !sleepRecords?.length || sleepRecords.length < 3}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Sleep Analysis
                </>
              )}
            </Button>

            {analysis && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-2">AI Analysis</h4>
                  <div className="prose prose-sm text-muted-foreground whitespace-pre-wrap">
                    {analysis}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!sleepRecords?.length || sleepRecords.length < 3) && (
              <p className="text-sm text-muted-foreground text-center">
                Log at least 3 days of sleep to get AI analysis
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
