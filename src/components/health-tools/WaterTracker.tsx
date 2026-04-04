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
import { Progress } from "@/components/ui/progress";
import { Droplets, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportWaterRecords } from "@/lib/exportHealth";
import { format, startOfDay, isToday } from "date-fns";

const DRINK_TYPES = [
  { value: "water", label: "Water", icon: "💧" },
  { value: "tea", label: "Tea", icon: "🍵" },
  { value: "coffee", label: "Coffee", icon: "☕" },
  { value: "juice", label: "Juice", icon: "🧃" },
  { value: "milk", label: "Milk", icon: "🥛" },
  { value: "other", label: "Other", icon: "🥤" },
];

const QUICK_ADD_OPTIONS = [100, 200, 250, 500];
const DAILY_GOAL = 2500; // 2.5L recommended daily intake

interface WaterRecord {
  id: string;
  intake_date: string;
  intake_ml: number;
  drink_type: string;
  notes: string | null;
  created_at: string;
}

export function WaterTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [drinkType, setDrinkType] = useState("water");
  const [notes, setNotes] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["water-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WaterRecord[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (ml: number) => {
      if (!user?.id) throw new Error("Not logged in");

      const { error } = await supabase.from("water_records").insert({
        user_id: user.id,
        intake_ml: ml,
        drink_type: drinkType,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-records"] });
      toast.success("Water intake logged!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save record");
      console.error(error);
    },
  });

  const resetForm = () => {
    setAmount("");
    setDrinkType("water");
    setNotes("");
  };

  const handleQuickAdd = (ml: number) => {
    saveMutation.mutate(ml);
  };

  const handleCustomAdd = () => {
    const ml = parseInt(amount);
    if (ml > 0) {
      saveMutation.mutate(ml);
    }
  };

  // Calculate today's total intake
  const todayTotal = records
    ?.filter((r) => isToday(new Date(r.intake_date)))
    .reduce((sum, r) => sum + r.intake_ml, 0) || 0;

  const progressPercent = Math.min((todayTotal / DAILY_GOAL) * 100, 100);

  // Calculate daily totals for trend chart
  const dailyTotals = records?.reduce((acc, record) => {
    const date = format(new Date(record.intake_date), "yyyy-MM-dd");
    acc[date] = (acc[date] || 0) + record.intake_ml;
    return acc;
  }, {} as Record<string, number>);

  const trendData = dailyTotals
    ? Object.entries(dailyTotals)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Water Tracker</h3>
                <Badge variant="secondary" className="text-xs">Core Feature</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Track daily hydration</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-medium">{(todayTotal / 1000).toFixed(1)}L / {DAILY_GOAL / 1000}L</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Water Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportWaterRecords(records || [])}
              disabled={!records?.length}
            />
          </div>
          <DialogDescription>
            Track your daily water intake and stay hydrated
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log Intake</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            {/* Daily Progress */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Today's Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-500">
                    {(todayTotal / 1000).toFixed(1)}L
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {progressPercent >= 100
                    ? "🎉 Goal achieved!"
                    : `${Math.round(DAILY_GOAL - todayTotal)}ml remaining to reach your goal`}
                </p>
              </CardContent>
            </Card>

            {/* Quick Add Buttons */}
            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_ADD_OPTIONS.map((ml) => (
                  <Button
                    key={ml}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(ml)}
                    disabled={saveMutation.isPending}
                    className="flex flex-col items-center py-3"
                  >
                    <Plus className="h-4 w-4 mb-1" />
                    <span>{ml}ml</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-3">
              <Label>Custom Amount</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Amount (ml)</Label>
                  <Input
                    type="number"
                    placeholder="300"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Drink Type</Label>
                  <Select value={drinkType} onValueChange={setDrinkType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRINK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                onClick={handleCustomAdd}
                disabled={!amount || saveMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {amount ? `${amount}ml` : "Intake"}
              </Button>
            </div>

            {/* Today's Log */}
            {records && records.filter((r) => isToday(new Date(r.intake_date))).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Today's Log</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {records
                    .filter((r) => isToday(new Date(r.intake_date)))
                    .map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {DRINK_TYPES.find((t) => t.value === record.drink_type)?.icon || "💧"}
                          </span>
                          <span className="text-sm font-medium">{record.intake_ml}ml</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.created_at), "h:mm a")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {trendData.length > 0 ? (
              <MiniTrendChart
                data={trendData}
                title="Daily Water Intake (Last 14 Days)"
                unit="ml"
                color="hsl(200, 100%, 50%)"
                height={200}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start logging your water intake to see trends
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
