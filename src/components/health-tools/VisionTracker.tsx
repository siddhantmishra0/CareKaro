import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";

interface VisionRecord {
  id: string;
  recorded_at: string;
  left_eye_vision: string | null;
  right_eye_vision: string | null;
  screen_time_hours: number | null;
  symptoms: string[] | null;
  notes: string | null;
}

const VISION_SYMPTOMS = [
  "Eye strain",
  "Headaches",
  "Blurred vision",
  "Dry eyes",
  "Double vision",
  "Light sensitivity",
  "Difficulty focusing",
  "Eye fatigue",
];

export const VisionTracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<VisionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [leftEye, setLeftEye] = useState("");
  const [rightEye, setRightEye] = useState("");
  const [screenTime, setScreenTime] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vision_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("vision_records").insert({
        user_id: user.id,
        left_eye_vision: leftEye || null,
        right_eye_vision: rightEye || null,
        screen_time_hours: screenTime ? parseFloat(screenTime) : null,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Vision record saved!");
      setOpen(false);
      setLeftEye("");
      setRightEye("");
      setScreenTime("");
      setSelectedSymptoms([]);
      setNotes("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const latestRecord = records[0];
  const screenTimeTrend = records
    .filter((r) => r.screen_time_hours !== null)
    .slice(0, 14)
    .reverse()
    .map((r) => ({ value: r.screen_time_hours || 0, date: r.recorded_at }));

  const avgScreenTime =
    records.length > 0
      ? records.reduce((sum, r) => sum + (r.screen_time_hours || 0), 0) / records.length
      : 0;

  const exportData = records.map((r) => ({
    Date: format(new Date(r.recorded_at), "yyyy-MM-dd"),
    "Left Eye": r.left_eye_vision || "",
    "Right Eye": r.right_eye_vision || "",
    "Screen Time (hrs)": r.screen_time_hours || "",
    Symptoms: r.symptoms?.join(", ") || "",
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Vision Health Tracker</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestRecord
                  ? `Avg screen time: ${avgScreenTime.toFixed(1)}h/day`
                  : "Eye health monitoring"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Vision Health Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="log">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leftEye">Left Eye Vision</Label>
                <Input
                  id="leftEye"
                  value={leftEye}
                  onChange={(e) => setLeftEye(e.target.value)}
                  placeholder="e.g., 20/20"
                />
              </div>
              <div>
                <Label htmlFor="rightEye">Right Eye Vision</Label>
                <Input
                  id="rightEye"
                  value={rightEye}
                  onChange={(e) => setRightEye(e.target.value)}
                  placeholder="e.g., 20/25"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="screenTime">Screen Time Today (hours)</Label>
              <Input
                id="screenTime"
                type="number"
                value={screenTime}
                onChange={(e) => setScreenTime(e.target.value)}
                placeholder="e.g., 8"
                step="0.5"
              />
            </div>

            <div>
              <Label className="mb-2 block">Symptoms</Label>
              <div className="grid grid-cols-2 gap-2">
                {VISION_SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm font-normal">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations..."
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Vision Health Records",
                filename: "vision-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Left Eye", accessor: "Left Eye" },
                  { header: "Right Eye", accessor: "Right Eye" },
                  { header: "Screen Time (hrs)", accessor: "Screen Time (hrs)" },
                  { header: "Symptoms", accessor: "Symptoms" },
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
                            {record.left_eye_vision && `L: ${record.left_eye_vision}`}
                            {record.left_eye_vision && record.right_eye_vision && " | "}
                            {record.right_eye_vision && `R: ${record.right_eye_vision}`}
                            {!record.left_eye_vision && !record.right_eye_vision && "Vision check"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.recorded_at), "PPP")}
                            {record.screen_time_hours && ` • ${record.screen_time_hours}h screen time`}
                          </p>
                        </div>
                      </div>
                      {record.symptoms && record.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {record.symptoms.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
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
            {screenTimeTrend.length > 1 ? (
              <MiniTrendChart data={screenTimeTrend} title="Screen Time" unit="hrs" color="#6366F1" />
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
