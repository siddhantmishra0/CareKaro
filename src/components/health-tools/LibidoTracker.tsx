import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";

interface LibidoRecord {
  id: string;
  recorded_at: string;
  libido_level: number | null;
  mood: string | null;
  stress_level: number | null;
  sleep_hours: number | null;
  exercise_done: boolean;
  notes: string | null;
}

export const LibidoTracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LibidoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [libidoLevel, setLibidoLevel] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [sleepHours, setSleepHours] = useState([7]);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("libido_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("libido_records").insert({
        user_id: user.id,
        libido_level: libidoLevel[0],
        stress_level: stressLevel[0],
        sleep_hours: sleepHours[0],
        exercise_done: exerciseDone,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Record saved!");
      setOpen(false);
      setLibidoLevel([5]);
      setStressLevel([5]);
      setSleepHours([7]);
      setExerciseDone(false);
      setNotes("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const getLibidoLabel = (level: number) => {
    if (level <= 3) return { label: "Low", color: "text-red-500" };
    if (level <= 6) return { label: "Moderate", color: "text-yellow-500" };
    return { label: "High", color: "text-green-500" };
  };

  const latestRecord = records[0];
  const trendData = records
    .slice(0, 10)
    .reverse()
    .map((r) => ({ value: r.libido_level || 0, date: r.recorded_at }));

  const exportData = records.map((r) => ({
    Date: format(new Date(r.recorded_at), "yyyy-MM-dd"),
    "Libido Level": r.libido_level || "",
    "Stress Level": r.stress_level || "",
    "Sleep Hours": r.sleep_hours || "",
    Exercised: r.exercise_done ? "Yes" : "No",
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Libido Tracker</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestRecord
                  ? `Today: ${getLibidoLabel(latestRecord.libido_level || 5).label}`
                  : "Track your patterns"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Libido Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="log">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6 mt-4">
            <div>
              <Label>Libido Level: {libidoLevel[0]}/10</Label>
              <Slider
                value={libidoLevel}
                onValueChange={setLibidoLevel}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <p className={`text-sm mt-1 ${getLibidoLabel(libidoLevel[0]).color}`}>
                {getLibidoLabel(libidoLevel[0]).label}
              </p>
            </div>

            <div>
              <Label>Stress Level: {stressLevel[0]}/10</Label>
              <Slider
                value={stressLevel}
                onValueChange={setStressLevel}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Sleep Hours: {sleepHours[0]}h</Label>
              <Slider
                value={sleepHours}
                onValueChange={setSleepHours}
                max={12}
                min={1}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="exercise"
                checked={exerciseDone}
                onCheckedChange={(checked) => setExerciseDone(checked as boolean)}
              />
              <Label htmlFor="exercise">Exercised today</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any factors affecting your libido..."
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Libido Records",
                filename: "libido-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Libido Level", accessor: "Libido Level" },
                  { header: "Stress Level", accessor: "Stress Level" },
                  { header: "Sleep Hours", accessor: "Sleep Hours" },
                  { header: "Exercised", accessor: "Exercised" },
                  { header: "Notes", accessor: "Notes" },
                ],
                data: exportData,
              })} />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No records yet</p>
              ) : (
                records.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Libido: {record.libido_level}/10 | Stress: {record.stress_level}/10
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.recorded_at), "PPP")} •{" "}
                            Sleep: {record.sleep_hours}h •{" "}
                            {record.exercise_done ? "Exercised" : "No exercise"}
                          </p>
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-sm mt-2 text-muted-foreground">{record.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            {trendData.length > 1 ? (
              <div className="space-y-6">
                <MiniTrendChart data={trendData} title="Libido Level" unit="/10" color="#EC4899" />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Need at least 2 records for trends
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
