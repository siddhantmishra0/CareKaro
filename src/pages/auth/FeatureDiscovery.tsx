import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { 
  Activity, Heart, Brain, Droplets, Baby, Moon, Thermometer, 
  Pill, AlertTriangle, Clock, Zap, Users, FileText, Stethoscope,
  TestTube, HeartPulse, Scan, Eye, Scale, Dumbbell, Bed, Coffee
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag?: string;
}

const menFeatures: Feature[] = [
  { icon: <Zap className="h-5 w-5" />, title: "AI Testosterone Analyzer", description: "Track and analyze testosterone levels with AI insights", tag: "AI Powered" },
  { icon: <Heart className="h-5 w-5" />, title: "Libido Tracker", description: "Monitor and understand your libido patterns" },
  { icon: <Activity className="h-5 w-5" />, title: "Erectile Dysfunction Assessment", description: "IIEF-5 based clinical assessment tool" },
  { icon: <Clock className="h-5 w-5" />, title: "Premature Ejaculation Assessment", description: "PEDT validated questionnaire" },
  { icon: <Droplets className="h-5 w-5" />, title: "Sperm Health & Fertility Tools", description: "Comprehensive fertility tracking and analysis" },
  { icon: <Stethoscope className="h-5 w-5" />, title: "Prostate Symptom Checker", description: "Early detection and monitoring tool" },
  { icon: <AlertTriangle className="h-5 w-5" />, title: "BPH Risk Assessment", description: "Benign prostatic hyperplasia risk evaluation" },
  { icon: <Brain className="h-5 w-5" />, title: "Addiction Recovery Tools", description: "Support for porn addiction recovery" },
  { icon: <Coffee className="h-5 w-5" />, title: "Alcohol & Smoking Tracker", description: "Track consumption and set goals" },
];

const womenFeatures: Feature[] = [
  { icon: <Moon className="h-5 w-5" />, title: "Period & Menstrual Tracker", description: "Accurate cycle tracking with predictions", tag: "Popular" },
  { icon: <Brain className="h-5 w-5" />, title: "PMS Predictor", description: "Anticipate and prepare for PMS symptoms" },
  { icon: <AlertTriangle className="h-5 w-5" />, title: "PCOS Risk Assessment", description: "Polycystic ovary syndrome evaluation" },
  { icon: <Zap className="h-5 w-5" />, title: "Ovulation Predictor", description: "AI-powered fertile window tracking", tag: "AI Powered" },
  { icon: <Droplets className="h-5 w-5" />, title: "Vaginal Infection Checker", description: "Symptom-based assessment tool" },
  { icon: <Activity className="h-5 w-5" />, title: "UTI Risk Checker", description: "Urinary tract infection risk evaluation" },
  { icon: <TestTube className="h-5 w-5" />, title: "Hormone Insights", description: "Estrogen & progesterone tracking" },
  { icon: <Thermometer className="h-5 w-5" />, title: "Menopause Tracker", description: "Track symptoms through perimenopause" },
  { icon: <Thermometer className="h-5 w-5" />, title: "Hot Flash Tracker", description: "Monitor frequency and triggers" },
  { icon: <Heart className="h-5 w-5" />, title: "Mood & Anxiety Tracking", description: "Emotional wellbeing monitoring" },
];

const pregnancyFeatures: Feature[] = [
  { icon: <Baby className="h-5 w-5" />, title: "Fertile Window AI", description: "Maximize conception chances", tag: "AI Powered" },
  { icon: <Clock className="h-5 w-5" />, title: "Contraction Timer", description: "Track labor contractions accurately" },
  { icon: <Activity className="h-5 w-5" />, title: "Kick Counter", description: "Monitor baby movements" },
  { icon: <Pill className="h-5 w-5" />, title: "Safe Medicines Checker", description: "Pregnancy-safe medication guide" },
  { icon: <AlertTriangle className="h-5 w-5" />, title: "High-Risk Pregnancy Alerts", description: "Personalized risk monitoring" },
  { icon: <Heart className="h-5 w-5" />, title: "Miscarriage Guidance", description: "Personalized support and resources" },
];

const commonFeatures: Feature[] = [
  { icon: <TestTube className="h-5 w-5" />, title: "Blood Test Analysis", description: "AI-powered blood report interpretation", tag: "Core Feature" },
  { icon: <HeartPulse className="h-5 w-5" />, title: "ECG Analysis", description: "Electrocardiogram report insights" },
  { icon: <Scan className="h-5 w-5" />, title: "X-Ray & MRI Analysis", description: "Medical imaging interpretation" },
  { icon: <Eye className="h-5 w-5" />, title: "Vision Health Tracker", description: "Eye health monitoring" },
  { icon: <Scale className="h-5 w-5" />, title: "BMI & Weight Tracker", description: "Body composition tracking" },
  { icon: <Dumbbell className="h-5 w-5" />, title: "Fitness Integration", description: "Connect with fitness devices" },
  { icon: <Bed className="h-5 w-5" />, title: "Sleep Quality Tracker", description: "Monitor sleep patterns" },
  { icon: <Brain className="h-5 w-5" />, title: "Mental Health Check-ins", description: "Regular wellbeing assessments" },
  { icon: <FileText className="h-5 w-5" />, title: "Medical Report Storage", description: "Secure document management" },
  { icon: <Users className="h-5 w-5" />, title: "Specialist Recommendations", description: "AI-driven doctor suggestions" },
];

const FeatureCard = ({ feature }: { feature: Feature }) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
    <CardContent className="p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {feature.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
          {feature.tag && (
            <Badge variant="secondary" className="text-xs">{feature.tag}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
      </div>
    </CardContent>
  </Card>
);

const FeatureDiscovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGender = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("gender")
        .eq("user_id", user.id)
        .single();

      if (profile?.gender) {
        setGender(profile.gender);
      }
      setLoading(false);
    };

    fetchGender();
  }, [user]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const genderSpecificFeatures = gender === "male" ? menFeatures : gender === "female" ? womenFeatures : [];
  const showPregnancyFeatures = gender === "female";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome to CareKaro! 🎉
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Based on your profile, here are the personalized health tools available for you. 
            All features are designed to help you take control of your health journey.
          </p>
        </div>

        {/* Gender-Specific Features */}
        {genderSpecificFeatures.length > 0 && (
          <section>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Personalized for You
                </CardTitle>
                <CardDescription>
                  Health tools specifically designed for {gender === "male" ? "men's" : "women's"} health needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {genderSpecificFeatures.map((feature, index) => (
                    <FeatureCard key={index} feature={feature} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Pregnancy & Fertility Features for Women */}
        {showPregnancyFeatures && (
          <section>
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Baby className="h-5 w-5 text-accent" />
                  Pregnancy & Fertility
                </CardTitle>
                <CardDescription>
                  Comprehensive tools for your fertility and pregnancy journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pregnancyFeatures.map((feature, index) => (
                    <FeatureCard key={index} feature={feature} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Common Features */}
        <section>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-muted-foreground" />
                Core Health Features
              </CardTitle>
              <CardDescription>
                Essential health tools available for everyone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {commonFeatures.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={handleContinue} className="px-12">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeatureDiscovery;
