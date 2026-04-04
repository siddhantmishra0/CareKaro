import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Droplets, 
  Moon, 
  Footprints, 
  TrendingUp,
  CheckCircle2,
  Loader2,
  Pencil,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoalConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
  defaultTarget: number;
}

const GOAL_CONFIGS: GoalConfig[] = [
  {
    id: "water",
    name: "Daily Water",
    icon: <Droplets className="h-4 w-4" />,
    unit: "glasses",
    color: "bg-blue-500",
    defaultTarget: 8,
  },
  {
    id: "sleep",
    name: "Sleep",
    icon: <Moon className="h-4 w-4" />,
    unit: "hours",
    color: "bg-purple-500",
    defaultTarget: 8,
  },
  {
    id: "steps",
    name: "Daily Steps",
    icon: <Footprints className="h-4 w-4" />,
    unit: "steps",
    color: "bg-emerald-500",
    defaultTarget: 10000,
  },
];

const PatientWellnessWidget = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [steps, setSteps] = useState(0);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [waterRes, sleepRes, fitnessRes, goalsRes] = await Promise.all([
      supabase.from("water_records").select("intake_ml").eq("user_id", user.id).eq("intake_date", today),
      supabase.from("sleep_records").select("duration_hours").eq("user_id", user.id).eq("sleep_date", today),
      supabase.from("fitness_records").select("steps").eq("user_id", user.id).eq("recorded_at", today),
      supabase.from("wellness_goals").select("goal_type, target_value").eq("user_id", user.id),
    ]);

    setWaterMl((waterRes.data ?? []).reduce((s, r) => s + (r.intake_ml ?? 0), 0));
    setSleepHours((sleepRes.data ?? []).reduce((s, r) => s + Number(r.duration_hours ?? 0), 0));
    setSteps((fitnessRes.data ?? []).reduce((s, r) => s + (r.steps ?? 0), 0));

    const t: Record<string, number> = {};
    (goalsRes.data ?? []).forEach((g: any) => { t[g.goal_type] = Number(g.target_value); });
    setTargets(t);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTarget = (goalId: string) => targets[goalId] ?? GOAL_CONFIGS.find(g => g.id === goalId)!.defaultTarget;

  const getCurrent = (goalId: string) => {
    if (goalId === "water") return Math.round((waterMl / 250) * 10) / 10;
    if (goalId === "sleep") return Math.round(sleepHours * 10) / 10;
    return steps;
  };

  const handleSaveTarget = async (goalId: string) => {
    if (!user) return;
    const val = Number(editValue);
    if (isNaN(val) || val <= 0) { toast.error("Enter a valid positive number"); return; }

    setSaving(true);
    const { error } = await supabase.from("wellness_goals").upsert(
      { user_id: user.id, goal_type: goalId, target_value: val },
      { onConflict: "user_id,goal_type" }
    );
    setSaving(false);

    if (error) { toast.error("Failed to save target"); return; }
    setTargets(prev => ({ ...prev, [goalId]: val }));
    setEditing(null);
    toast.success("Goal target updated!");
  };

  const goals = GOAL_CONFIGS.map(cfg => ({
    ...cfg,
    current: getCurrent(cfg.id),
    target: getTarget(cfg.id),
  }));

  const getProgress = (current: number, target: number) => Math.min((current / target) * 100, 100);
  const completedGoals = goals.filter(g => g.current >= g.target).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Wellness Goals
            </CardTitle>
            <CardDescription>Track your daily health goals</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedGoals}/{goals.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal.current, goal.target);
            const isEditing = editing === goal.id;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${goal.color} text-white`}>
                      {goal.icon}
                    </div>
                    <span className="font-medium text-foreground">{goal.name}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="h-7 w-20 text-xs"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleSaveTarget(goal.id); if (e.key === "Escape") setEditing(null); }}
                      />
                      <span className="text-xs text-muted-foreground">{goal.unit}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveTarget(goal.id)} disabled={saving}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => { setEditing(goal.id); setEditValue(String(goal.target)); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })
        )}

        <div className="pt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            {completedGoals === goals.length
              ? "All goals met! Amazing work! 🎉"
              : completedGoals > 0
              ? "You're making progress! Keep it up."
              : "Start tracking to see your progress."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientWellnessWidget;
