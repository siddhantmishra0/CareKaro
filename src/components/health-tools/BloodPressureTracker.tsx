import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportBloodPressureRecords } from "@/lib/exportHealth";
import { format } from "date-fns";

interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

const getBPCategory = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80) {
    return { label: "Normal", color: "bg-green-500", severity: "normal" };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return { label: "Elevated", color: "bg-yellow-500", severity: "elevated" };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return { label: "High BP Stage 1", color: "bg-orange-500", severity: "high1" };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: "High BP Stage 2", color: "bg-red-500", severity: "high2" };
  }
  if (systolic > 180 || diastolic > 120) {
    return { label: "Crisis", color: "bg-red-700", severity: "crisis" };
  }
  return { label: "Unknown", color: "bg-gray-500", severity: "unknown" };
};

export function BloodPressureTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["bp-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_pressure_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("recorded_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as BPRecord[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not logged in");

      const sys = parseInt(systolic);
      const dia = parseInt(diastolic);
      const pul = pulse ? parseInt(pulse) : null;

      if (sys < 70 || sys > 250 || dia < 40 || dia > 150) {
        throw new Error("Please enter valid blood pressure values");
      }

      const { error } = await supabase.from("blood_pressure_records").insert({
        user_id: user.id,
        systolic: sys,
        diastolic: dia,
        pulse: pul,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bp-records"] });
      toast.success("Blood pressure recorded!");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save record");
      console.error(error);
    },
  });

  const resetForm = () => {
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setNotes("");
  };

  const latestRecord = records?.[0];
  const previousRecord = records?.[1];
  const systolicTrend = latestRecord && previousRecord
    ? latestRecord.systolic - previousRecord.systolic
    : null;

  const latestCategory = latestRecord
    ? getBPCategory(latestRecord.systolic, latestRecord.diastolic)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Blood Pressure</h3>
                <Badge variant="secondary" className="text-xs">Core Feature</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monitor BP readings</p>
              {latestRecord && latestCategory && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-foreground">
                    {latestRecord.systolic}/{latestRecord.diastolic}
                  </span>
                  <Badge className={latestCategory.color}>{latestCategory.label}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              Blood Pressure Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportBloodPressureRecords(records || [])}
              disabled={!records?.length}
            />
          </div>
          <DialogDescription>
            Track your blood pressure readings over time
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log Reading</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            {/* BP Reference Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Normal: &lt;120/80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Elevated: 120-129/&lt;80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>High Stage 1: 130-139/80-89</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>High Stage 2: ≥140/≥90</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic (mmHg)</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse (bpm)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    placeholder="72"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="After exercise, medication, resting, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Preview */}
              {systolic && diastolic && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Reading</p>
                    <p className="text-3xl font-bold text-foreground">
                      {systolic}/{diastolic}
                      {pulse && <span className="text-lg ml-2 text-muted-foreground">({pulse} bpm)</span>}
                    </p>
                    <Badge className={`${getBPCategory(parseInt(systolic), parseInt(diastolic)).color} mt-2`}>
                      {getBPCategory(parseInt(systolic), parseInt(diastolic)).label}
                    </Badge>
                    {getBPCategory(parseInt(systolic), parseInt(diastolic)).severity === "crisis" && (
                      <div className="flex items-center justify-center gap-2 mt-3 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Seek immediate medical attention!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!systolic || !diastolic || saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? "Saving..." : "Save Reading"}
              </Button>
            </div>

            {/* Recent Records */}
            {records && records.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Recent Readings</h4>
                  {systolicTrend !== null && (
                    <div className="flex items-center gap-1 text-sm">
                      {systolicTrend > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">+{systolicTrend}</span>
                        </>
                      ) : systolicTrend < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">{systolicTrend}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">No change</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {records.slice(0, 5).map((record) => {
                    const category = getBPCategory(record.systolic, record.diastolic);
                    return (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {record.systolic}/{record.diastolic}
                            {record.pulse && <span className="text-muted-foreground ml-1">({record.pulse} bpm)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.recorded_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Badge className={category.color}>{category.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {records && records.length > 0 ? (
              <>
                <MiniTrendChart
                  data={[...records].reverse().map((r) => ({
                    date: r.recorded_at,
                    value: r.systolic,
                  }))}
                  title="Systolic Pressure Over Time"
                  unit=" mmHg"
                  color="hsl(0, 84%, 60%)"
                  height={150}
                />
                <MiniTrendChart
                  data={[...records].reverse().map((r) => ({
                    date: r.recorded_at,
                    value: r.diastolic,
                  }))}
                  title="Diastolic Pressure Over Time"
                  unit=" mmHg"
                  color="hsl(25, 95%, 53%)"
                  height={150}
                />
                {records.some((r) => r.pulse) && (
                  <MiniTrendChart
                    data={[...records]
                      .filter((r) => r.pulse)
                      .reverse()
                      .map((r) => ({
                        date: r.recorded_at,
                        value: r.pulse!,
                      }))}
                    title="Pulse Over Time"
                    unit=" bpm"
                    color="hsl(340, 82%, 52%)"
                    height={150}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start logging your blood pressure to see trends
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
