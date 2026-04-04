import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Play, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { ExportDropdown } from "./ExportDropdown";

interface ContractionRecord {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  intensity: number | null;
  notes: string | null;
}

export const ContractionTimer = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ContractionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [intensity, setIntensity] = useState([5]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("contraction_records")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startContraction = async () => {
    if (!user) return;

    const now = new Date();
    setStartTime(now);
    setIsActive(true);
    setElapsed(0);

    try {
      const { error } = await supabase.from("contraction_records").insert({
        user_id: user.id,
        started_at: now.toISOString(),
        intensity: intensity[0],
      });

      if (error) throw error;
      fetchRecords();
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const stopContraction = async () => {
    if (!user || !startTime) return;

    setIsActive(false);
    setLoading(true);

    try {
      const latestRecord = records[0];
      if (latestRecord && !latestRecord.ended_at) {
        const { error } = await supabase
          .from("contraction_records")
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: elapsed,
            intensity: intensity[0],
          })
          .eq("id", latestRecord.id);

        if (error) throw error;
        toast.success(`Contraction recorded: ${elapsed} seconds`);
      }

      fetchRecords();
    } catch (error) {
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
      setStartTime(null);
      setElapsed(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAverageInterval = () => {
    if (records.length < 2) return null;
    const completedRecords = records.filter((r) => r.ended_at);
    if (completedRecords.length < 2) return null;

    let totalInterval = 0;
    for (let i = 0; i < completedRecords.length - 1; i++) {
      totalInterval += differenceInMinutes(
        new Date(completedRecords[i].started_at),
        new Date(completedRecords[i + 1].started_at)
      );
    }
    return Math.round(totalInterval / (completedRecords.length - 1));
  };

  const getAverageDuration = () => {
    const withDuration = records.filter((r) => r.duration_seconds);
    if (withDuration.length === 0) return null;
    const total = withDuration.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    return Math.round(total / withDuration.length);
  };

  const avgInterval = getAverageInterval();
  const avgDuration = getAverageDuration();
  const shouldGoToHospital = avgInterval !== null && avgInterval <= 5 && avgDuration !== null && avgDuration >= 60;

  const exportData = records.map((r) => ({
    Started: format(new Date(r.started_at), "yyyy-MM-dd HH:mm:ss"),
    Ended: r.ended_at ? format(new Date(r.ended_at), "HH:mm:ss") : "",
    "Duration (s)": r.duration_seconds || "",
    Intensity: r.intensity || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Contraction Timer</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {avgInterval ? `Avg interval: ${avgInterval} min` : "Track labor contractions"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Contraction Timer
          </DialogTitle>
        </DialogHeader>

        {shouldGoToHospital && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Consider going to the hospital</p>
              <p className="text-sm">Contractions are 5 minutes apart or less and lasting 60+ seconds</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="timer">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="mt-4">
            <div className="text-center space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Interval</p>
                  <p className="text-2xl font-bold">{avgInterval ? `${avgInterval} min` : "--"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{avgDuration ? `${avgDuration}s` : "--"}</p>
                </div>
              </div>

              <div className="py-8">
                <p className="text-6xl font-mono font-bold">{formatTime(elapsed)}</p>
                <p className="text-muted-foreground mt-2">
                  {isActive ? "Contraction in progress..." : "Press Start when contraction begins"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Intensity: {intensity[0]}/10</Label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={10}
                  min={1}
                  step={1}
                  disabled={isActive}
                />
              </div>

              {!isActive ? (
                <Button onClick={startContraction} size="lg" className="w-full">
                  <Play className="mr-2 h-5 w-5" />
                  Start Contraction
                </Button>
              ) : (
                <Button
                  onClick={stopContraction}
                  size="lg"
                  variant="destructive"
                  className="w-full"
                  disabled={loading}
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop Contraction
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Contraction Records",
                filename: "contraction-records",
                columns: [
                  { header: "Started", accessor: "Started" },
                  { header: "Ended", accessor: "Ended" },
                  { header: "Duration (s)", accessor: "Duration (s)" },
                  { header: "Intensity", accessor: "Intensity" },
                ],
                data: exportData,
              })} />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No contractions recorded yet</p>
              ) : (
                records.map((record, index) => {
                  const nextRecord = records[index + 1];
                  const interval = nextRecord
                    ? differenceInMinutes(new Date(record.started_at), new Date(nextRecord.started_at))
                    : null;

                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {format(new Date(record.started_at), "h:mm a")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Duration: {record.duration_seconds ? `${record.duration_seconds}s` : "In progress"}
                              {record.intensity && ` • Intensity: ${record.intensity}/10`}
                            </p>
                          </div>
                          {interval !== null && (
                            <Badge variant="outline">{interval} min apart</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
