import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportWeightRecords } from "@/lib/exportHealth";

interface WeightRecord {
  id: string;
  weight: number;
  height: number;
  bmi: number;
  recorded_at: string;
  notes: string | null;
}

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "bg-green-500" };
  if (bmi < 30) return { label: "Overweight", color: "bg-yellow-500" };
  return { label: "Obese", color: "bg-red-500" };
};

export function BMICalculator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ["weight-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("recorded_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as WeightRecord[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !calculatedBMI) throw new Error("Missing data");
      
      const { error } = await supabase.from("weight_records").insert({
        user_id: user.id,
        weight: parseFloat(weight),
        height: parseFloat(height),
        bmi: calculatedBMI,
        notes: notes || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-records"] });
      toast.success("Weight record saved!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save record");
      console.error(error);
    },
  });

  const resetForm = () => {
    setWeight("");
    setHeight("");
    setNotes("");
    setCalculatedBMI(null);
  };

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Convert cm to m
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      setCalculatedBMI(Math.round(bmi * 10) / 10);
    }
  };

  const latestRecord = records?.[0];
  const previousRecord = records?.[1];
  const weightTrend = latestRecord && previousRecord 
    ? latestRecord.weight - previousRecord.weight 
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Scale className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">BMI & Weight Tracker</h3>
                <Badge variant="secondary" className="text-xs">Core Feature</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Body composition tracking</p>
              {latestRecord && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-foreground">{latestRecord.bmi}</span>
                  <Badge className={getBMICategory(latestRecord.bmi).color}>
                    {getBMICategory(latestRecord.bmi).label}
                  </Badge>
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
              <Scale className="h-5 w-5 text-primary" />
              BMI Calculator & Weight Tracker
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportWeightRecords(records || [])}
              disabled={!records?.length}
            />
          </div>
          <DialogDescription>
            Track your weight and calculate your Body Mass Index
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log Weight</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            {/* Calculator Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Morning weight, after exercise, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={calculateBMI} variant="outline" className="w-full">
                Calculate BMI
              </Button>

              {calculatedBMI && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Your BMI</p>
                    <p className="text-4xl font-bold text-foreground">{calculatedBMI}</p>
                    <Badge className={`${getBMICategory(calculatedBMI).color} mt-2`}>
                      {getBMICategory(calculatedBMI).label}
                    </Badge>
                    <Button 
                      onClick={() => saveMutation.mutate()} 
                      className="w-full mt-4"
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Record"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* History Section */}
            {records && records.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Recent Records</h4>
                  {weightTrend !== null && (
                    <div className="flex items-center gap-1 text-sm">
                      {weightTrend > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">+{weightTrend.toFixed(1)} kg</span>
                        </>
                      ) : weightTrend < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">{weightTrend.toFixed(1)} kg</span>
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
                  {records.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{record.weight} kg</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getBMICategory(record.bmi).color}>
                        {record.bmi}
                      </Badge>
                    </div>
                  ))}
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
                    value: r.weight,
                  }))}
                  title="Weight Over Time"
                  unit=" kg"
                  color="hsl(var(--primary))"
                  height={180}
                />
                <MiniTrendChart
                  data={[...records].reverse().map((r) => ({
                    date: r.recorded_at,
                    value: r.bmi,
                  }))}
                  title="BMI Over Time"
                  unit=""
                  color="hsl(142, 76%, 36%)"
                  height={180}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start logging your weight to see trends over time
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
