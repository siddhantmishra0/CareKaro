import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Stethoscope, Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

const ASSESSMENT_TYPES = [
  { value: "general", label: "General Symptoms" },
  { value: "headache", label: "Headache" },
  { value: "digestive", label: "Digestive Issues" },
  { value: "respiratory", label: "Respiratory" },
  { value: "skin", label: "Skin Issues" },
  { value: "joint_pain", label: "Joint/Muscle Pain" },
];

const SYMPTOMS_BY_TYPE: Record<string, string[]> = {
  general: ["Fever", "Fatigue", "Weakness", "Chills", "Night sweats", "Weight changes", "Loss of appetite", "Dizziness"],
  headache: ["Throbbing pain", "Pressure feeling", "Light sensitivity", "Nausea", "Neck stiffness", "Vision changes", "One-sided pain", "Triggered by stress"],
  digestive: ["Nausea", "Vomiting", "Diarrhea", "Constipation", "Bloating", "Abdominal pain", "Heartburn", "Blood in stool"],
  respiratory: ["Cough", "Shortness of breath", "Wheezing", "Chest tightness", "Sore throat", "Runny nose", "Congestion", "Phlegm production"],
  skin: ["Rash", "Itching", "Redness", "Swelling", "Dry skin", "Blisters", "Discoloration", "Unusual moles"],
  joint_pain: ["Stiffness", "Swelling", "Limited mobility", "Muscle aches", "Joint redness", "Weakness", "Numbness", "Sharp pain"],
};

interface AnalysisResult {
  analysis: string;
  recommendations: string[];
  urgency_level: "low" | "medium" | "high" | "critical";
  seek_care_when: string;
}

export function SymptomChecker() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (!user?.id || !assessmentType || selectedSymptoms.length === 0) {
      toast.error("Please select assessment type and at least one symptom");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "symptom_assessment",
          userId: user.id,
          data: {
            assessmentType,
            symptoms: selectedSymptoms,
            severity: severity || "moderate",
            duration: duration || "Not specified",
          },
        },
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      toast.error("Failed to analyze symptoms. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setAssessmentType("");
    setSelectedSymptoms([]);
    setSeverity("");
    setDuration("");
    setResult(null);
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-green-500" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const currentSymptoms = assessmentType ? SYMPTOMS_BY_TYPE[assessmentType] || [] : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card cursor-pointer">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Symptom Checker</h3>
                <Badge variant="secondary" className="text-xs">AI Powered</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Get AI-powered symptom analysis</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            AI Symptom Checker
          </DialogTitle>
          <DialogDescription>
            Describe your symptoms for AI-powered health insights. This is not a medical diagnosis.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Disclaimer:</strong> This tool provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div className="space-y-2">
              <Label>What type of symptoms are you experiencing?</Label>
              <Select value={assessmentType} onValueChange={(value) => { setAssessmentType(value); setSelectedSymptoms([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symptom type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentSymptoms.length > 0 && (
              <div className="space-y-2">
                <Label>Select all symptoms that apply</Label>
                <div className="grid grid-cols-2 gap-2">
                  {currentSymptoms.map((symptom) => (
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="How long?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Less than 24 hours">Less than 24 hours</SelectItem>
                    <SelectItem value="1-3 days">1-3 days</SelectItem>
                    <SelectItem value="4-7 days">4-7 days</SelectItem>
                    <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                    <SelectItem value="More than 2 weeks">More than 2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isAnalyzing || !assessmentType || selectedSymptoms.length === 0}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                "Get AI Analysis"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Urgency Banner */}
            <Card className={`${getUrgencyColor(result.urgency_level)} text-white`}>
              <CardContent className="p-4 flex items-center gap-3">
                {getUrgencyIcon(result.urgency_level)}
                <div>
                  <p className="font-medium capitalize">{result.urgency_level} Urgency</p>
                  <p className="text-sm opacity-90">{result.seek_care_when}</p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {result.analysis}
                </p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Self-Care Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Remember: This is AI-generated information for educational purposes only. 
                Always consult a healthcare professional for medical advice.
              </p>
            </div>

            <Button onClick={resetForm} variant="outline" className="w-full">
              Check Different Symptoms
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
