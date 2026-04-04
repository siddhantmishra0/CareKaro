import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { 
  Zap, Baby, Stethoscope, Clock
} from "lucide-react";

// Core Health Tools
import { BMICalculator } from "@/components/health-tools/BMICalculator";
import { MentalHealthCheckin } from "@/components/health-tools/MentalHealthCheckin";
import { PeriodTracker } from "@/components/health-tools/PeriodTracker";
import { SleepTracker } from "@/components/health-tools/SleepTracker";
import { SymptomChecker } from "@/components/health-tools/SymptomChecker";
import { WaterTracker } from "@/components/health-tools/WaterTracker";
import { BloodPressureTracker } from "@/components/health-tools/BloodPressureTracker";
import { MedicationTracker } from "@/components/health-tools/MedicationTracker";
import { VisionTracker } from "@/components/health-tools/VisionTracker";
import { FitnessTracker } from "@/components/health-tools/FitnessTracker";

// Men's Health Tools
import { TestosteroneAnalyzer } from "@/components/health-tools/TestosteroneAnalyzer";
import { LibidoTracker } from "@/components/health-tools/LibidoTracker";
import { SubstanceTracker } from "@/components/health-tools/SubstanceTracker";
import { HealthAssessment } from "@/components/health-tools/HealthAssessment";
import { erectileDysfunctionConfig, prostateConfig } from "@/components/health-tools/assessmentConfigs";

// Women's Health Tools
import { pcosConfig, vaginalInfectionConfig, hormoneConfig, menopauseConfig } from "@/components/health-tools/assessmentConfigs";

// Pregnancy Tools
import { ContractionTimer } from "@/components/health-tools/ContractionTimer";
import { KickCounter } from "@/components/health-tools/KickCounter";
import { SafeMedicinesChecker } from "@/components/health-tools/SafeMedicinesChecker";

import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";

const HealthTools = () => {
  const { user } = useAuth();
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

  const { canAccess, getRequiredPlan, isLoading: subLoading } = useSubscription();

  if (loading) {
    return (
      <Layout showSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!subLoading && !canAccess("health_tools")) {
    return (
      <Layout showSidebar>
        <SEOHead title="Health Tools" description="Personalized health tools including BMI calculator, sleep tracker, blood pressure monitor, and more." path="/health-tools" />
        <div className="space-y-8 p-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Health Tools</h1>
            <p className="text-muted-foreground mt-2">Personalized health tools designed for your wellness journey</p>
          </div>
          <UpgradePrompt
            feature="Health Tools"
            requiredPlan={getRequiredPlan("health_tools")}
            description="Access advanced health tools including symptom checker, medication tracker, fitness tracker and more."
          />
        </div>
      </Layout>
    );
  }

  const showMenFeatures = gender === "male";
  const showWomenFeatures = gender === "female";

  return (
    <Layout showSidebar>
      <SEOHead title="Health Tools" description="Personalized health tools including BMI calculator, sleep tracker, blood pressure monitor, and more." path="/health-tools" />
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Tools</h1>
          <p className="text-muted-foreground mt-2">
            Personalized health tools designed for your wellness journey
          </p>
        </div>

        {/* Men's Health Features */}
        {showMenFeatures && (
          <section>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Men's Health
                </CardTitle>
                <CardDescription>
                  Health tools specifically designed for men's health needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <TestosteroneAnalyzer />
                  <LibidoTracker />
                  <HealthAssessment config={erectileDysfunctionConfig} />
                  <HealthAssessment config={prostateConfig} />
                  <SubstanceTracker />
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Women's Health Features */}
        {showWomenFeatures && (
          <section>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Women's Health
                </CardTitle>
                <CardDescription>
                  Health tools specifically designed for women's health needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <PeriodTracker />
                  <HealthAssessment config={pcosConfig} />
                  <HealthAssessment config={vaginalInfectionConfig} />
                  <HealthAssessment config={hormoneConfig} />
                  <HealthAssessment config={menopauseConfig} />
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Pregnancy & Fertility Features for Women */}
        {showWomenFeatures && (
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
                  <ContractionTimer />
                  <KickCounter />
                  <SafeMedicinesChecker />
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Core Health Features - Available for Everyone */}
        <section>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Core Health Features
              </CardTitle>
              <CardDescription>
                AI-powered health tools available for everyone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <BMICalculator />
                <MentalHealthCheckin />
                <SleepTracker />
                <SymptomChecker />
                <WaterTracker />
                <BloodPressureTracker />
                <MedicationTracker />
                <VisionTracker />
                <FitnessTracker />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Substance Tracker for Everyone (moved here if not male) */}
        {!showMenFeatures && (
          <section>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Lifestyle Tracking
                </CardTitle>
                <CardDescription>
                  Monitor lifestyle habits for better health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <SubstanceTracker />
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default HealthTools;