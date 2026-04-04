import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import HealthOverviewCards from "@/components/dashboard/HealthOverviewCards";
import HealthSummaryWidget from "@/components/dashboard/HealthSummaryWidget";
import RecentReportsWidget from "@/components/dashboard/RecentReportsWidget";
import QuickActionsPanel from "@/components/dashboard/QuickActionsPanel";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import PatientWellnessWidget from "@/components/dashboard/PatientWellnessWidget";
import PatientHealthTipsWidget from "@/components/dashboard/PatientHealthTipsWidget";
import PatientMedicationReminder from "@/components/dashboard/PatientMedicationReminder";
import MedicalFilesWidget from "@/components/dashboard/MedicalFilesWidget";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  display_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  chronic_conditions: string[] | null;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, gender, date_of_birth, blood_group, chronic_conditions")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as UserProfile);
      });
  }, [user]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <Layout showSidebar>
      <SEOHead title="Dashboard" description="View your health overview, recent reports, and personalized health insights on CareKaro." path="/dashboard" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {getGreeting()}, <span className="font-medium text-foreground">{displayName}</span>! Here's your health overview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <HealthSummaryWidget />
              <HealthOverviewCards />
              <RecentReportsWidget />
              <MedicalFilesWidget />
            </div>
            <div className="space-y-6">
              <QuickActionsPanel />
              <PatientWellnessWidget />
              <PatientHealthTipsWidget gender={profile?.gender} dateOfBirth={profile?.date_of_birth} bloodGroup={profile?.blood_group} healthConditions={profile?.chronic_conditions?.join(", ") || null} />
              <PatientMedicationReminder />
              <NotificationPanel />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
