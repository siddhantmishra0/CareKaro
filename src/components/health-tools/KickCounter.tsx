import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Plus, Check, Baby } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { ExportDropdown } from "./ExportDropdown";
import { Progress } from "@/components/ui/progress";

interface KickRecord {
  id: string;
  session_start: string;
  session_end: string | null;
  kick_count: number;
  target_kicks: number;
  notes: string | null;
}

export const KickCounter = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<KickRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSession, setIsSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [kickCount, setKickCount] = useState(0);
  const [targetKicks, setTargetKicks] = useState(10);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("kick_records")
      .select("*")
      .eq("user_id", user.id)
      .order("session_start", { ascending: false })
      .limit(30);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  useEffect(() => {
    if (isSession) {
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
  }, [isSession]);

  const startSession = async () => {
    if (!user) return;

    const now = new Date();
    setSessionStart(now);
    setIsSession(true);
    setElapsed(0);
    setKickCount(0);

    try {
      const { data, error } = await supabase
        .from("kick_records")
        .insert({
          user_id: user.id,
          session_start: now.toISOString(),
          target_kicks: targetKicks,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setSessionId(data.id);
    } catch (error) {
      toast.error("Failed to start session");
    }
  };

  const recordKick = async () => {
    if (!sessionId) return;

    const newCount = kickCount + 1;
    setKickCount(newCount);

    try {
      await supabase
        .from("kick_records")
        .update({ kick_count: newCount })
        .eq("id", sessionId);

      if (newCount >= targetKicks) {
        toast.success(`Target of ${targetKicks} kicks reached!`);
        endSession();
      }
    } catch (error) {
      console.error("Failed to update kick count");
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("kick_records")
        .update({
          session_end: new Date().toISOString(),
          kick_count: kickCount,
          notes: notes || null,
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success(`Session ended: ${kickCount} kicks in ${formatTime(elapsed)}`);
      setIsSession(false);
      setSessionId(null);
      setKickCount(0);
      setElapsed(0);
      setNotes("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const latestRecord = records[0];
  const progress = (kickCount / targetKicks) * 100;

  const exportData = records.map((r) => ({
    Date: format(new Date(r.session_start), "yyyy-MM-dd"),
    "Start Time": format(new Date(r.session_start), "HH:mm"),
    "End Time": r.session_end ? format(new Date(r.session_end), "HH:mm") : "",
    "Kick Count": r.kick_count,
    Target: r.target_kicks,
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Kick Counter</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestRecord
                  ? `Last session: ${latestRecord.kick_count} kicks`
                  : "Monitor baby movements"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Kick Counter
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="counter">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="counter">Counter</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="counter" className="mt-4">
            {!isSession ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <Baby className="h-12 w-12 mx-auto text-accent mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Count 10 kicks to monitor your baby's activity. Most babies reach 10 movements within 2 hours.
                  </p>
                </div>

                <div>
                  <Label htmlFor="target">Target kicks</Label>
                  <Input
                    id="target"
                    type="number"
                    value={targetKicks}
                    onChange={(e) => setTargetKicks(parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                  />
                </div>

                <Button onClick={startSession} size="lg" className="w-full">
                  Start Counting Session
                </Button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Session Time</p>
                  <p className="text-3xl font-mono font-bold">{formatTime(elapsed)}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2">
                    {kickCount} of {targetKicks} kicks
                  </p>
                  <Progress value={progress} className="h-3" />
                </div>

                <Button
                  onClick={recordKick}
                  size="lg"
                  className="w-32 h-32 rounded-full text-4xl"
                  disabled={kickCount >= targetKicks}
                >
                  {kickCount >= targetKicks ? <Check className="h-12 w-12" /> : <Plus className="h-12 w-12" />}
                </Button>

                <p className="text-6xl font-bold">{kickCount}</p>
                <p className="text-muted-foreground">kicks recorded</p>

                <div>
                  <Label htmlFor="sessionNotes">Notes (optional)</Label>
                  <Textarea
                    id="sessionNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations..."
                  />
                </div>

                <Button
                  onClick={endSession}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  End Session
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Kick Count Records",
                filename: "kick-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Start Time", accessor: "Start Time" },
                  { header: "End Time", accessor: "End Time" },
                  { header: "Kick Count", accessor: "Kick Count" },
                  { header: "Target", accessor: "Target" },
                  { header: "Notes", accessor: "Notes" },
                ],
                data: exportData,
              })} />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sessions yet</p>
              ) : (
                records.map((record) => {
                  const duration = record.session_end
                    ? differenceInMinutes(new Date(record.session_end), new Date(record.session_start))
                    : null;
                  const reachedTarget = record.kick_count >= record.target_kicks;

                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {record.kick_count} kicks
                              {duration !== null && ` in ${duration} minutes`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.session_start), "PPP 'at' h:mm a")}
                            </p>
                          </div>
                          <Badge variant={reachedTarget ? "default" : "secondary"}>
                            {reachedTarget ? "Target reached" : `${record.kick_count}/${record.target_kicks}`}
                          </Badge>
                        </div>
                        {record.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{record.notes}</p>
                        )}
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
