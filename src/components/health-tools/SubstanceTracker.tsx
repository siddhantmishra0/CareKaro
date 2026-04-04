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
import { Coffee, Plus, Wine, Cigarette } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";

interface SubstanceRecord {
  id: string;
  recorded_at: string;
  substance_type: string;
  quantity: number | null;
  unit: string | null;
  trigger_reason: string | null;
  notes: string | null;
}

export const SubstanceTracker = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<SubstanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [substanceType, setSubstanceType] = useState("alcohol");
  const [quantity, setQuantity] = useState("");
  const [triggerReason, setTriggerReason] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("substance_records")
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
    if (!user || !quantity) {
      toast.error("Please enter quantity");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("substance_records").insert({
        user_id: user.id,
        substance_type: substanceType,
        quantity: parseFloat(quantity),
        unit: substanceType === "alcohol" ? "drinks" : "cigarettes",
        trigger_reason: triggerReason || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Record saved!");
      setOpen(false);
      setQuantity("");
      setTriggerReason("");
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

    const alcoholTotal = weeklyRecords
      .filter((r) => r.substance_type === "alcohol")
      .reduce((sum, r) => sum + (r.quantity || 0), 0);

    const smokingTotal = weeklyRecords
      .filter((r) => r.substance_type === "smoking")
      .reduce((sum, r) => sum + (r.quantity || 0), 0);

    return { alcoholTotal, smokingTotal };
  };

  const stats = getWeeklyStats();

  const alcoholTrend = records
    .filter((r) => r.substance_type === "alcohol")
    .slice(0, 14)
    .reverse()
    .map((r) => ({ value: r.quantity || 0, date: r.recorded_at }));

  const smokingTrend = records
    .filter((r) => r.substance_type === "smoking")
    .slice(0, 14)
    .reverse()
    .map((r) => ({ value: r.quantity || 0, date: r.recorded_at }));

  const exportData = records.map((r) => ({
    Date: format(new Date(r.recorded_at), "yyyy-MM-dd"),
    Type: r.substance_type,
    Quantity: r.quantity || "",
    Unit: r.unit || "",
    Trigger: r.trigger_reason || "",
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Alcohol & Smoking Tracker</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This week: {stats.alcoholTotal} drinks, {stats.smokingTotal} cigarettes
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Alcohol & Smoking Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="log">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <Wine className="h-6 w-6 mx-auto text-purple-500" />
                <p className="text-2xl font-bold">{stats.alcoholTotal}</p>
                <p className="text-xs text-muted-foreground">Drinks this week</p>
              </div>
              <div className="text-center">
                <Cigarette className="h-6 w-6 mx-auto text-orange-500" />
                <p className="text-2xl font-bold">{stats.smokingTotal}</p>
                <p className="text-xs text-muted-foreground">Cigarettes this week</p>
              </div>
            </div>

            <div>
              <Label>Substance Type</Label>
              <Select value={substanceType} onValueChange={setSubstanceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alcohol">Alcohol</SelectItem>
                  <SelectItem value="smoking">Smoking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">
                Quantity ({substanceType === "alcohol" ? "drinks" : "cigarettes"})
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="trigger">What triggered this?</Label>
              <Select value={triggerReason} onValueChange={setTriggerReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stress">Stress</SelectItem>
                  <SelectItem value="social">Social situation</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                  <SelectItem value="boredom">Boredom</SelectItem>
                  <SelectItem value="celebration">Celebration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Log Entry"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Substance Use Records",
                filename: "substance-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Type", accessor: "Type" },
                  { header: "Quantity", accessor: "Quantity" },
                  { header: "Unit", accessor: "Unit" },
                  { header: "Trigger", accessor: "Trigger" },
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
                        <div className="flex items-center gap-2">
                          {record.substance_type === "alcohol" ? (
                            <Wine className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Cigarette className="h-4 w-4 text-orange-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {record.quantity} {record.unit}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.recorded_at), "PPP")}
                            </p>
                          </div>
                        </div>
                        {record.trigger_reason && (
                          <Badge variant="outline">{record.trigger_reason}</Badge>
                        )}
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
            {alcoholTrend.length > 1 && (
              <MiniTrendChart data={alcoholTrend} title="Alcohol (drinks)" unit="" color="#9333EA" />
            )}
            {smokingTrend.length > 1 && (
              <MiniTrendChart data={smokingTrend} title="Smoking (cigarettes)" unit="" color="#F97316" />
            )}
            {alcoholTrend.length <= 1 && smokingTrend.length <= 1 && (
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
