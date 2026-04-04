import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";

interface TestosteroneRecord {
  id: string;
  recorded_at: string;
  total_testosterone: number | null;
  free_testosterone: number | null;
  testosterone_unit: string;
  notes: string | null;
  ai_insights: string | null;
}

export const TestosteroneAnalyzer = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TestosteroneRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [totalT, setTotalT] = useState("");
  const [freeT, setFreeT] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("testosterone_records")
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
    if (!user || !totalT) {
      toast.error("Please enter total testosterone value");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("testosterone_records").insert({
        user_id: user.id,
        total_testosterone: parseFloat(totalT),
        free_testosterone: freeT ? parseFloat(freeT) : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Testosterone record added!");
      setOpen(false);
      setTotalT("");
      setFreeT("");
      setNotes("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async (record: TestosteroneRecord) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "testosterone_analysis",
          userId: user?.id,
          data: {
            totalTestosterone: record.total_testosterone,
            freeTestosterone: record.free_testosterone,
            allRecords: records.slice(0, 10),
          },
        },
      });

      if (error) throw error;

      await supabase
        .from("testosterone_records")
        .update({ ai_insights: data.insights })
        .eq("id", record.id);

      toast.success("AI analysis complete!");
      fetchRecords();
    } catch (error) {
      toast.error("AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const getTestosteroneStatus = (value: number | null) => {
    if (!value) return { label: "Unknown", variant: "secondary" as const };
    if (value < 300) return { label: "Low", variant: "destructive" as const };
    if (value > 1000) return { label: "High", variant: "default" as const };
    return { label: "Normal", variant: "secondary" as const };
  };

  const latestRecord = records[0];
  const trendData = records
    .slice(0, 10)
    .reverse()
    .map((r) => ({ value: r.total_testosterone || 0, date: r.recorded_at }));

  const exportData = records.map((r) => ({
    Date: format(new Date(r.recorded_at), "yyyy-MM-dd"),
    "Total Testosterone": r.total_testosterone || "",
    "Free Testosterone": r.free_testosterone || "",
    Unit: r.testosterone_unit,
    Notes: r.notes || "",
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">AI Testosterone Analyzer</h3>
                <Badge variant="default" className="text-xs">AI Powered</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestRecord
                  ? `Latest: ${latestRecord.total_testosterone} ng/dL`
                  : "Track testosterone levels"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Testosterone Analyzer
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
                <Label htmlFor="totalT">Total Testosterone (ng/dL)</Label>
                <Input
                  id="totalT"
                  type="number"
                  value={totalT}
                  onChange={(e) => setTotalT(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <Label htmlFor="freeT">Free Testosterone (pg/mL)</Label>
                <Input
                  id="freeT"
                  type="number"
                  value={freeT}
                  onChange={(e) => setFreeT(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
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
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-4">
              <ExportDropdown getExportOptions={() => ({
                title: "Testosterone Records",
                filename: "testosterone-records",
                columns: [
                  { header: "Date", accessor: "Date" },
                  { header: "Total Testosterone", accessor: "Total Testosterone" },
                  { header: "Free Testosterone", accessor: "Free Testosterone" },
                  { header: "Unit", accessor: "Unit" },
                  { header: "Notes", accessor: "Notes" },
                ],
                data: exportData,
              })} />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No records yet</p>
              ) : (
                records.map((record) => {
                  const status = getTestosteroneStatus(record.total_testosterone);
                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              Total: {record.total_testosterone} ng/dL
                              {record.free_testosterone && ` | Free: ${record.free_testosterone} pg/mL`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.recorded_at), "PPP")}
                            </p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {record.ai_insights && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">{record.ai_insights}</p>
                        )}
                        {!record.ai_insights && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => analyzeWithAI(record)}
                            disabled={analyzing}
                          >
                            {analyzing ? "Analyzing..." : "Get AI Insights"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            {trendData.length > 1 ? (
              <MiniTrendChart data={trendData} title="Total Testosterone" unit="ng/dL" color="#2563EB" />
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
