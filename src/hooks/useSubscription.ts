import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getSubscription, PlanName } from "@/services/subscriptionService";

// Feature access matrix
const PLAN_HIERARCHY: Record<PlanName, number> = {
  Free: 0,
  Standard: 1,
  Premium: 2,
};

export type GatedFeature =
  | "health_trends"
  | "health_tools"
  | "recommendations"
  | "family"
  | "unlimited_uploads"
  | "export_reports"
  | "share_reports";

const FEATURE_MIN_PLAN: Record<GatedFeature, PlanName> = {
  health_trends: "Standard",
  health_tools: "Standard",
  recommendations: "Standard",
  family: "Premium",
  unlimited_uploads: "Standard",
  export_reports: "Standard",
  share_reports: "Standard",
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: getSubscription,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const plan = subscription?.plan ?? "Free";

  const canAccess = (feature: GatedFeature): boolean => {
    const requiredPlan = FEATURE_MIN_PLAN[feature];
    return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[requiredPlan];
  };

  const getRequiredPlan = (feature: GatedFeature): PlanName => {
    return FEATURE_MIN_PLAN[feature];
  };

  return {
    subscription,
    plan,
    isLoading,
    canAccess,
    getRequiredPlan,
    isPaid: plan !== "Free",
  };
}
