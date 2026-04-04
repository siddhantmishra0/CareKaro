import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { LucideIcon } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

interface AssessmentConfig {
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  questions: Question[];
  getResult: (score: number) => { severity: string; message: string };
}

interface AssessmentRecord {
  id: string;
  assessment_date: string;
  score: number | null;
  severity: string | null;
  ai_analysis: string | null;
  recommendations: string[] | null;
}

interface HealthAssessmentProps {
  config: AssessmentConfig;
  tag?: string;
}

export const HealthAssessment = ({ config, tag = "Assessment" }: HealthAssessmentProps) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [analyzing, setAnalyzing] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("health_assessments")
      .select("*")
      .eq("user_id", user.id)
      .eq("assessment_type", config.type)
      .order("assessment_date", { ascending: false })
      .limit(20);
    if (data) setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, [user, config.type]);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < config.questions.length) {
      toast.error("Please answer all questions");
      return;
    }

    setLoading(true);
    try {
      const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
      const result = config.getResult(totalScore);

      const { error } = await supabase.from("health_assessments").insert({
        user_id: user.id,
        assessment_type: config.type,
        score: totalScore,
        severity: result.severity,
        answers: answers,
      });

      if (error) throw error;

      toast.success("Assessment completed!");
      setOpen(false);
      setAnswers({});
      fetchRecords();
    } catch (error) {
      toast.error("Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (record: AssessmentRecord) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "health_assessment_analysis",
          userId: user?.id,
          data: {
            assessmentType: config.type,
            score: record.score,
            severity: record.severity,
          },
        },
      });

      if (error) throw error;

      await supabase
        .from("health_assessments")
        .update({
          ai_analysis: data.analysis,
          recommendations: data.recommendations,
        })
        .eq("id", record.id);

      toast.success("AI analysis complete!");
      fetchRecords();
    } catch (error) {
      toast.error("AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityVariant = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case "severe":
      case "high":
        return "destructive";
      case "moderate":
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const latestRecord = records[0];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">{config.title}</h3>
                <Badge variant="secondary" className="text-xs">{tag}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestRecord
                  ? `Last: ${latestRecord.severity || "Completed"}`
                  : config.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="assess">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assess">Take Assessment</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="assess" className="space-y-6 mt-4">
            {config.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-sm font-medium">
                  {index + 1}. {question.text}
                </Label>
                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswer(question.id, parseInt(value))}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`${question.id}-${option.value}`}
                      />
                      <Label htmlFor={`${question.id}-${option.value}`} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Assessment"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No assessments yet</p>
              ) : (
                records.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Score: {record.score}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.assessment_date), "PPP")}
                          </p>
                        </div>
                        <Badge variant={getSeverityVariant(record.severity)}>
                          {record.severity || "Completed"}
                        </Badge>
                      </div>
                      {record.ai_analysis && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">{record.ai_analysis}</p>
                          {record.recommendations && record.recommendations.length > 0 && (
                            <ul className="mt-2 text-sm list-disc list-inside">
                              {record.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {!record.ai_analysis && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => getAIAnalysis(record)}
                          disabled={analyzing}
                        >
                          {analyzing ? "Analyzing..." : "Get AI Insights"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
