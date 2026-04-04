import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import TrendChart from "@/components/health/TrendChart";
import ParameterSelector from "@/components/health/ParameterSelector";
import DateRangeSelector from "@/components/health/DateRangeSelector";
import TrendAnalysisCard from "@/components/health/TrendAnalysisCard";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { databaseService } from "@/services/database";
import { subMonths, subYears, startOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";

const HealthTrends = () => {
  const { user } = useAuth();
  const { canAccess, getRequiredPlan, isLoading: subLoading } = useSubscription();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });

  const { data: allMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["health-metrics", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await databaseService.healthMetrics.getByUserId(user.id);
    },
    enabled: !!user?.id,
  });

  // Get unique metric names for parameter selector
  const availableParameters = Array.from(
    new Set(allMetrics?.map(m => m.metric_name) || [])
  ).sort();

  // Auto-select first parameter if none selected
  useEffect(() => {
    if (!selectedParameter && availableParameters.length > 0) {
      setSelectedParameter(availableParameters[0]);
    }
  }, [availableParameters, selectedParameter]);

  // Filter metrics by selected parameter and date range
  const filteredMetrics = allMetrics?.filter(metric => {
    if (!selectedParameter || metric.metric_name !== selectedParameter) return false;
    
    if (dateRange?.from && dateRange?.to) {
      const metricDate = new Date(metric.recorded_at || metric.created_at || "");
      return metricDate >= startOfDay(dateRange.from) && metricDate <= dateRange.to;
    }
    
    return true;
  }) || [];

  if (!subLoading && !canAccess("health_trends")) {
    return (
      <Layout showSidebar>
        <SEOHead title="Health Trends" description="Track your health metrics over time with interactive charts and AI-powered trend analysis." path="/trends" />
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Health Trends</h1>
              <p className="text-muted-foreground mt-1">Track your health metrics over time</p>
            </div>
            <UpgradePrompt
              feature="Health Trends"
              requiredPlan={getRequiredPlan("health_trends")}
              description="Get complete health trend tracking with interactive charts, parameter comparisons, and AI-powered analysis."
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar>
      <SEOHead title="Health Trends" description="Track your health metrics over time with interactive charts and AI-powered trend analysis." path="/trends" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Health Trends</h1>
            <p className="text-muted-foreground mt-1">Track your health metrics over time</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <ParameterSelector 
                parameters={availableParameters}
                selectedParameter={selectedParameter}
                onParameterChange={setSelectedParameter}
              />
            </Card>
            <Card className="p-4 lg:col-span-2">
              <DateRangeSelector 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Card>
          </div>

          <TrendChart 
            metrics={filteredMetrics}
            selectedParameter={selectedParameter}
            isLoading={loadingMetrics}
          />

          <TrendAnalysisCard 
            metrics={filteredMetrics}
            selectedParameter={selectedParameter}
          />
        </div>
      </div>
    </Layout>
  );
};

export default HealthTrends;
