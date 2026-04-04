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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Check, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExportDropdown } from "./ExportDropdown";
import { exportMedicationRecords } from "@/lib/exportHealth";
import { format, isToday, isYesterday, startOfDay, subDays } from "date-fns";

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning", icon: "🌅" },
  { value: "afternoon", label: "Afternoon", icon: "☀️" },
  { value: "evening", label: "Evening", icon: "🌆" },
  { value: "night", label: "Night", icon: "🌙" },
];

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "as_needed", label: "As needed" },
  { value: "weekly", label: "Weekly" },
];

interface MedicationRecord {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  time_of_day: string[] | null;
  taken_at: string;
  notes: string | null;
  created_at: string;
}

export function MedicationTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["medication-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("taken_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as MedicationRecord[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !medicationName) throw new Error("Missing data");

      const { error } = await supabase.from("medication_records").insert({
        user_id: user.id,
        medication_name: medicationName,
        dosage: dosage || null,
        frequency: frequency || null,
        time_of_day: selectedTimes.length > 0 ? selectedTimes : null,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-records"] });
      toast.success("Medication logged!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save record");
      console.error(error);
    },
  });

  const resetForm = () => {
    setMedicationName("");
    setDosage("");
    setFrequency("");
    setSelectedTimes([]);
    setNotes("");
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time]
    );
  };

  // Get unique medications from records
  const uniqueMedications = [...new Set(records?.map((r) => r.medication_name) || [])];

  // Today's medications
  const todayMedications = records?.filter((r) => isToday(new Date(r.taken_at))) || [];

  // Group records by date for history
  const groupedRecords = records?.reduce((acc, record) => {
    const date = format(new Date(record.taken_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, MedicationRecord[]>);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Medication Tracker</h3>
                <Badge variant="secondary" className="text-xs">Core Feature</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Log medications taken</p>
              {todayMedications.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {todayMedications.length} taken today
                  </span>
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
              <Pill className="h-5 w-5 text-purple-500" />
              Medication Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportMedicationRecords(records || [])}
              disabled={!records?.length}
            />
          </div>
          <DialogDescription>
            Log and track your medication intake
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log Medication</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            {/* Quick Log Previous Medications */}
            {uniqueMedications.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Quick Log</Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueMedications.slice(0, 6).map((med) => (
                    <Button
                      key={med}
                      variant="outline"
                      size="sm"
                      onClick={() => setMedicationName(med)}
                      className={medicationName === med ? "border-primary" : ""}
                    >
                      <Pill className="h-3 w-3 mr-1" />
                      {med}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Log Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medication">Medication Name *</Label>
                <Input
                  id="medication"
                  placeholder="e.g., Aspirin, Vitamin D"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg, 1 tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Time of Day</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OF_DAY_OPTIONS.map((time) => (
                    <div
                      key={time.value}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedTimes.includes(time.value)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => toggleTime(time.value)}
                    >
                      <Checkbox
                        checked={selectedTimes.includes(time.value)}
                        onCheckedChange={() => toggleTime(time.value)}
                      />
                      <span>{time.icon}</span>
                      <span className="text-sm">{time.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="With food, before bed, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!medicationName || saveMutation.isPending}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Logging..." : "Log Medication"}
              </Button>
            </div>

            {/* Today's Medications */}
            {todayMedications.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today's Medications
                </h4>
                <div className="space-y-2">
                  {todayMedications.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{record.medication_name}</p>
                          {record.dosage && (
                            <p className="text-xs text-muted-foreground">{record.dosage}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.taken_at), "h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {groupedRecords && Object.keys(groupedRecords).length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(groupedRecords)
                  .slice(0, 7)
                  .map(([date, dayRecords]) => (
                    <div key={date} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground sticky top-0 bg-background py-1">
                        {getDateLabel(date)}
                      </h4>
                      <div className="space-y-1">
                        {dayRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-purple-500" />
                              <div>
                                <p className="text-sm font-medium">{record.medication_name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {record.dosage && <span>{record.dosage}</span>}
                                  {record.time_of_day && record.time_of_day.length > 0 && (
                                    <span>
                                      {record.time_of_day
                                        .map((t) => TIME_OF_DAY_OPTIONS.find((o) => o.value === t)?.icon)
                                        .join(" ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(record.taken_at), "h:mm a")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No medication records yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
