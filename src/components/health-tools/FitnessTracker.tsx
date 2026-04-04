import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Dumbbell, Plus, Flame, Footprints, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";

interface FitnessRecord {
  id: string;
  recorded_at: string;
  activity_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  distance_km: number | null;
  steps: number | null;
  heart_rate_avg: number | null;
  notes: string | null;
}

const ACTIVITY_TYPES = [
  "Walking",
  "Running",
  "Cycling",
  "Swimming",
  "Weight Training",
  "Yoga",
  "HIIT",
  "Pilates",
  "Dance",
  "Sports",
  "Other",
];

export const FitnessTracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<FitnessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [distance, setDistance] = useState("");
  const [steps, setSteps] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("fitness_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(60);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !activityType) {
      toast.error("Please select an activity type");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("fitness_records").insert({
        user_id: user.id,
        activity_type: activityType,
        duration_minutes: duration ? parseInt(duration) : null,
        calories_burned: calories ? parseInt(calories) : null,
        distance_km: distance ? parseFloat(distance) : null,
        steps: steps ? parseInt(steps) : null,
        heart_rate_avg: heartRate ? parseInt(heartRate) : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Workout logged!");
      setOpen(false);
      setActivityType("");
      setDuration("");
      setCalories("");
      setDistance("");
      setSteps("");
      setHeartRate("");
      setNotes("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const weeklyRecords = records.filter((r) =>
      isWithinInterval(new Date(r.recorded_at), { start: weekStart, end: weekEnd })
    );

    return {
      workouts: weeklyRecords.length,
      minutes: weeklyRecords.reduce((sum, r) => sum + (r.duration_minutes || 0), 0),
      calories: weeklyRecords.reduce((sum, r) => sum + (r.calories_burned || 0), 0),
      steps: weeklyRecords.reduce((sum, r) => sum + (r.steps || 0), 0),
    };
  };

  const stats = getWeeklyStats();

  const calorieTrend = records
    .filter((r) => r.calories_burned)
    .slice(0, 14)
    .reverse()
    .map((r) => ({ value: r.calories_burned || 0, date: r.recorded_at }));

  const durationTrend = records
    .filter((r) => r.duration_minutes)
    .slice(0, 14)
    .reverse()
    .map((r) => ({ value: r.duration_minutes || 0, date: r.recorded_at }));

  const exportData = records.map((r) => ({
    Date: format(new Date(r.recorded_at), "yyyy-MM-dd"),
    Activity: r.activity_type,
    "Duration (min)": r.duration_minutes || "",
    Calories: r.calories_burned || "",
    "Distance (km)": r.distance_km || "",
    Steps: r.steps || "",
    "Avg Heart Rate": r.heart_rate_avg || "",
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Fitness Tracker</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This week: {stats.workouts} workouts, {stats.calories} cal
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Fitness Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="log">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log Workout</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <Dumbbell className="h-5 w-5 mx-auto text-primary" />
                <p className="text-xl font-bold">{stats.workouts}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto text-blue-500" />
                <p className="text-xl font-bold">{stats.minutes}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center">
                <Flame className="h-5 w-5 mx-auto text-orange-500" />
                <p className="text-xl font-bold">{stats.calories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center">
                <Footprints className="h-5 w-5 mx-auto text-green-500" />
                <p className="text-xl font-bold">{(stats.steps / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Steps</p>
              </div>
            </div>

            <div>
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <Label htmlFor="calories">Calories Burned</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 250"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 5"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="steps">Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="e.g., 8000"
                />
              </div>
              <div>
                <Label htmlFor="heartRate">Avg Heart Rate</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g., 130"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? Any observations..."
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Log Workout"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Fitness Records",
                filename: "fitness-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Activity", accessor: "Activity" },
                  { header: "Duration (min)", accessor: "Duration (min)" },
                  { header: "Calories", accessor: "Calories" },
                  { header: "Distance (km)", accessor: "Distance (km)" },
                  { header: "Steps", accessor: "Steps" },
                  { header: "Avg Heart Rate", accessor: "Avg Heart Rate" },
                  { header: "Notes", accessor: "Notes" },
                ],
                data: exportData,
              })} />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No workouts logged yet</p>
              ) : (
                records.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{record.activity_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.recorded_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {record.duration_minutes && (
                            <Badge variant="outline">{record.duration_minutes} min</Badge>
                          )}
                          {record.calories_burned && (
                            <Badge variant="outline">{record.calories_burned} cal</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        {record.distance_km && <span>{record.distance_km} km</span>}
                        {record.steps && <span>{record.steps.toLocaleString()} steps</span>}
                        {record.heart_rate_avg && <span>❤️ {record.heart_rate_avg} bpm</span>}
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

          <TabsContent value="trends" className="mt-4 space-y-6">
            {calorieTrend.length > 1 && (
              <MiniTrendChart data={calorieTrend} title="Calories Burned" unit="" color="#F97316" />
            )}
            {durationTrend.length > 1 && (
              <MiniTrendChart data={durationTrend} title="Duration" unit="min" color="#3B82F6" />
            )}
            {calorieTrend.length <= 1 && durationTrend.length <= 1 && (
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
