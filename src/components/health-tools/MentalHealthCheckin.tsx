import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { MiniTrendChart } from "./MiniTrendChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportMentalHealthRecords } from "@/lib/exportHealth";

const SYMPTOMS = [
  "Difficulty sleeping",
  "Loss of appetite",
  "Difficulty concentrating",
  "Feeling overwhelmed",
  "Mood swings",
  "Social withdrawal",
  "Physical tension",
  "Racing thoughts",
];

export function MentalHealthCheckin() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moodRating, setMoodRating] = useState([5]);
  const [anxietyLevel, setAnxietyLevel] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [journalEntry, setJournalEntry] = useState("");
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { data: recentCheckins } = useQuery({
    queryKey: ["mental-health-checkins", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mental_health_checkins")
        .select("*")
        .eq("user_id", user?.id)
        .order("checkin_date", { ascending: false })
        .limit(14);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [activeTab, setActiveTab] = useState("checkin");

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setAiInsights(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "mental_health_assessment",
          userId: user.id,
          data: {
            moodRating: moodRating[0],
            anxietyLevel: anxietyLevel[0],
            stressLevel: stressLevel[0],
            energyLevel: energyLevel[0],
            sleepQuality: sleepQuality[0],
            symptoms: selectedSymptoms,
            journalEntry,
          },
        },
      });

      if (error) throw error;

      setAiInsights(data.insights);
      toast.success("Check-in recorded successfully!");
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Failed to submit check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMoodRating([5]);
    setAnxietyLevel([5]);
    setStressLevel([5]);
    setEnergyLevel([5]);
    setSleepQuality([5]);
    setSelectedSymptoms([]);
    setJournalEntry("");
    setAiInsights(null);
  };

  const latestCheckin = recentCheckins?.[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Mental Health Check-ins</h3>
                <Badge variant="secondary" className="text-xs">AI Powered</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Regular wellbeing assessments</p>
              {latestCheckin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last check-in: {new Date(latestCheckin.checkin_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Mental Health Check-in
            </DialogTitle>
            <ExportDropdown
              getExportOptions={() => exportMentalHealthRecords(recentCheckins || [])}
              disabled={!recentCheckins?.length}
            />
          </div>
          <DialogDescription>
            Take a moment to reflect on your mental wellbeing. Your responses are private and will be analyzed by AI to provide personalized insights.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="mt-4">
            {!aiInsights ? (
              <div className="space-y-6">
                {/* Mood Sliders */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Mood Rating</Label>
                      <span className="text-sm text-muted-foreground">{moodRating[0]}/10</span>
                    </div>
                    <Slider value={moodRating} onValueChange={setMoodRating} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very Low</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Anxiety Level</Label>
                      <span className="text-sm text-muted-foreground">{anxietyLevel[0]}/10</span>
                    </div>
                    <Slider value={anxietyLevel} onValueChange={setAnxietyLevel} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Calm</span>
                      <span>Very Anxious</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Stress Level</Label>
                      <span className="text-sm text-muted-foreground">{stressLevel[0]}/10</span>
                    </div>
                    <Slider value={stressLevel} onValueChange={setStressLevel} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Relaxed</span>
                      <span>Very Stressed</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Energy Level</Label>
                      <span className="text-sm text-muted-foreground">{energyLevel[0]}/10</span>
                    </div>
                    <Slider value={energyLevel} onValueChange={setEnergyLevel} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Exhausted</span>
                      <span>Energetic</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Sleep Quality</Label>
                      <span className="text-sm text-muted-foreground">{sleepQuality[0]}/10</span>
                    </div>
                    <Slider value={sleepQuality} onValueChange={setSleepQuality} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="space-y-2">
                  <Label>Current Symptoms (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SYMPTOMS.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <label htmlFor={symptom} className="text-sm cursor-pointer">
                          {symptom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Journal */}
                <div className="space-y-2">
                  <Label htmlFor="journal">Journal Entry (optional)</Label>
                  <Textarea
                    id="journal"
                    placeholder="How are you feeling today? What's on your mind?"
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Get AI Insights"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground mb-2">AI Insights</h4>
                    <div className="prose prose-sm text-muted-foreground whitespace-pre-wrap">
                      {aiInsights}
                    </div>
                  </CardContent>
                </Card>
                <Button onClick={() => { resetForm(); }} variant="outline" className="w-full">
                  Start New Check-in
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {recentCheckins && recentCheckins.length > 0 ? (
              <>
                <MiniTrendChart
                  data={[...recentCheckins]
                    .filter((c) => c.mood_rating !== null)
                    .reverse()
                    .map((c) => ({
                      date: c.checkin_date,
                      value: c.mood_rating!,
                    }))}
                  title="Mood Rating (1-10)"
                  unit=""
                  color="hsl(142, 76%, 36%)"
                  height={150}
                />
                <MiniTrendChart
                  data={[...recentCheckins]
                    .filter((c) => c.stress_level !== null)
                    .reverse()
                    .map((c) => ({
                      date: c.checkin_date,
                      value: c.stress_level!,
                    }))}
                  title="Stress Level (1-10)"
                  unit=""
                  color="hsl(0, 84%, 60%)"
                  height={150}
                />
                <MiniTrendChart
                  data={[...recentCheckins]
                    .filter((c) => c.energy_level !== null)
                    .reverse()
                    .map((c) => ({
                      date: c.checkin_date,
                      value: c.energy_level!,
                    }))}
                  title="Energy Level (1-10)"
                  unit=""
                  color="hsl(45, 93%, 47%)"
                  height={150}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start doing check-ins to see your mental health trends over time
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
