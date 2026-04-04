import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SpecialistCard from "@/components/recommendations/SpecialistCard";
import RecommendationFilters from "@/components/recommendations/RecommendationFilters";
import { databaseService } from "@/services/database";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";

const Recommendations = () => {
  const { user } = useAuth();
  const { canAccess, getRequiredPlan, isLoading: subLoading } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await databaseService.recommendations.getByUserId(user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (recommendationId: string) => 
      databaseService.recommendations.acknowledge(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({
        title: "Recommendation Acknowledged",
        description: "This recommendation has been marked as acknowledged.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRecommendations = recommendations.filter((recommendation) => {
    const matchesSpecialty = selectedSpecialty === "all" || recommendation.specialty === selectedSpecialty;
    const matchesUrgency = selectedUrgency === "all" || recommendation.urgency === selectedUrgency;
    return matchesSpecialty && matchesUrgency;
  });

  if (!subLoading && !canAccess("recommendations")) {
    return (
      <Layout showSidebar>
        <SEOHead title="Specialist Recommendations" description="AI-suggested medical specialists based on your health report findings and urgency levels." path="/recommendations" />
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Specialist Recommendations</h1>
              <p className="text-muted-foreground mt-1">AI-suggested specialists based on your health reports</p>
            </div>
            <UpgradePrompt
              feature="Specialist Recommendations"
              requiredPlan={getRequiredPlan("recommendations")}
              description="Get AI-powered specialist suggestions with urgency levels based on your medical reports."
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar>
      <SEOHead title="Specialist Recommendations" description="AI-suggested medical specialists based on your health report findings and urgency levels." path="/recommendations" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Specialist Recommendations</h1>
            <p className="text-muted-foreground mt-1">AI-suggested specialists based on your health reports</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter Recommendations</CardTitle>
              <CardDescription>Find the right specialist for your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <RecommendationFilters
                selectedSpecialty={selectedSpecialty}
                selectedUrgency={selectedUrgency}
                onSpecialtyChange={setSelectedSpecialty}
                onUrgencyChange={setSelectedUrgency}
              />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {recommendations.length === 0
                    ? "No specialist recommendations yet. Upload a medical report to get personalized recommendations."
                    : "No specialists match your filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRecommendations.map((recommendation) => (
                <SpecialistCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onAcknowledge={() => acknowledgeMutation.mutate(recommendation.id)}
                  isAcknowledging={acknowledgeMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Recommendations;
