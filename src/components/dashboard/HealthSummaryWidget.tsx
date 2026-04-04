import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  Brain, 
  Moon, 
  Scale, 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { format, subDays } from "date-fns";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip,
  Area,
  AreaChart
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "good" | "warning" | "alert";
  chartData?: { value: number; date: string }[];
  linkTo?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  trendValue,
  status = "good",
  chartData,
  linkTo
}: MetricCardProps) => {
  const statusColors = {
    good: "text-accent",
    warning: "text-yellow-500",
    alert: "text-destructive"
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {status === "alert" && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">
              {value}
              {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
            </div>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs ${statusColors[status]}`}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          
          {chartData && chartData.length > 1 && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>;
  }
  
  return content;
};

const MoodIcon = ({ rating }: { rating: number }) => {
  if (rating >= 7) return <Smile className="h-5 w-5 text-accent" />;
  if (rating >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
  return <Frown className="h-5 w-5 text-destructive" />;
};

const HealthSummaryWidget = () => {
  const { user } = useAuth();

  // Fetch weight records
  const { data: weightData, isLoading: weightLoading } = useQuery({
    queryKey: ["weight-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("weight_records")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch sleep records
  const { data: sleepData, isLoading: sleepLoading } = useQuery({
    queryKey: ["sleep-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("sleep_records")
        .select("*")
        .eq("user_id", user.id)
        .order("sleep_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch mental health checkins
  const { data: mentalHealthData, isLoading: mentalLoading } = useQuery({
    queryKey: ["mental-health-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("mental_health_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch health metrics from reports
  const { data: healthMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["health-metrics-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const isLoading = weightLoading || sleepLoading || mentalLoading || metricsLoading;

  // Process weight data
  const latestWeight = weightData?.[0];
  const previousWeight = weightData?.[1];
  const weightTrend = latestWeight && previousWeight 
    ? Number(latestWeight.weight) > Number(previousWeight.weight) ? "up" : 
      Number(latestWeight.weight) < Number(previousWeight.weight) ? "down" : "stable"
    : undefined;
  const weightChange = latestWeight && previousWeight 
    ? Math.abs(Number(latestWeight.weight) - Number(previousWeight.weight)).toFixed(1)
    : undefined;
  const weightChartData = weightData?.slice().reverse().map(w => ({
    value: Number(w.weight),
    date: format(new Date(w.recorded_at), "MMM d")
  }));

  // Process BMI data
  const latestBMI = latestWeight?.bmi ? Number(latestWeight.bmi) : null;
  const bmiStatus = latestBMI 
    ? latestBMI < 18.5 || latestBMI >= 30 ? "alert" 
      : latestBMI >= 25 ? "warning" 
      : "good"
    : "good";
  const bmiChartData = weightData?.filter(w => w.bmi).slice().reverse().map(w => ({
    value: Number(w.bmi),
    date: format(new Date(w.recorded_at), "MMM d")
  }));

  // Process sleep data
  const latestSleep = sleepData?.[0];
  const avgSleepDuration = sleepData?.length 
    ? (sleepData.reduce((acc, s) => acc + Number(s.duration_hours || 0), 0) / sleepData.length).toFixed(1)
    : null;
  const avgSleepQuality = sleepData?.length
    ? Math.round(sleepData.reduce((acc, s) => acc + (s.quality_rating || 0), 0) / sleepData.length)
    : null;
  const sleepChartData = sleepData?.slice().reverse().map(s => ({
    value: Number(s.duration_hours || 0),
    date: format(new Date(s.sleep_date), "MMM d")
  }));

  // Process mental health data
  const latestMood = mentalHealthData?.[0];
  const avgMood = mentalHealthData?.length
    ? Math.round(mentalHealthData.reduce((acc, m) => acc + (m.mood_rating || 0), 0) / mentalHealthData.length)
    : null;
  const avgStress = mentalHealthData?.length
    ? Math.round(mentalHealthData.reduce((acc, m) => acc + (m.stress_level || 0), 0) / mentalHealthData.length)
    : null;
  const moodChartData = mentalHealthData?.slice().reverse().map(m => ({
    value: m.mood_rating || 0,
    date: format(new Date(m.checkin_date), "MMM d")
  }));

  // Process abnormal health metrics
  const abnormalMetrics = healthMetrics?.filter(m => m.is_abnormal) || [];
  const uniqueAbnormalMetrics = [...new Map(abnormalMetrics.map(m => [m.metric_name, m])).values()];

  // Check if any data exists
  const hasAnyData = weightData?.length || sleepData?.length || mentalHealthData?.length || healthMetrics?.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Start tracking your health to see your metrics here
          </p>
          <Button asChild>
            <Link to="/health-tools">Explore Health Tools</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health Summary
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/health-tools">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {latestWeight && (
            <MetricCard
              title="Weight"
              value={Number(latestWeight.weight).toFixed(1)}
              unit="kg"
              icon={Scale}
              trend={weightTrend}
              trendValue={weightChange ? `${weightChange} kg` : undefined}
              chartData={weightChartData}
              linkTo="/health-tools"
            />
          )}
          
          {latestBMI && (
            <MetricCard
              title="BMI"
              value={latestBMI.toFixed(1)}
              icon={Activity}
              status={bmiStatus}
              chartData={bmiChartData}
              linkTo="/health-tools"
            />
          )}
          
          {avgSleepDuration && (
            <MetricCard
              title="Avg Sleep"
              value={avgSleepDuration}
              unit="hrs"
              icon={Moon}
              status={Number(avgSleepDuration) < 6 ? "warning" : "good"}
              chartData={sleepChartData}
              linkTo="/health-tools"
            />
          )}
          
          {avgMood !== null && (
            <MetricCard
              title="Mood"
              value={avgMood}
              unit="/10"
              icon={Brain}
              status={avgMood < 4 ? "alert" : avgMood < 7 ? "warning" : "good"}
              chartData={moodChartData}
              linkTo="/health-tools"
            />
          )}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {avgSleepQuality !== null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sleep Quality</p>
                <p className="font-medium">{avgSleepQuality}/10</p>
              </div>
            </div>
          )}
          
          {avgStress !== null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stress Level</p>
                <p className="font-medium">{avgStress}/10</p>
              </div>
            </div>
          )}
          
          {latestMood && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MoodIcon rating={latestMood.mood_rating || 5} />
              <div>
                <p className="text-xs text-muted-foreground">Today's Mood</p>
                <p className="font-medium">{latestMood.mood_rating}/10</p>
              </div>
            </div>
          )}
          
          {healthMetrics && healthMetrics.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tracked Metrics</p>
                <p className="font-medium">{healthMetrics.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Abnormal Metrics Alert */}
        {uniqueAbnormalMetrics.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Attention Required
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueAbnormalMetrics.slice(0, 3).map(metric => (
                <span 
                  key={metric.id}
                  className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive"
                >
                  {metric.metric_name.replace(/_/g, ' ')}
                </span>
              ))}
              {uniqueAbnormalMetrics.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{uniqueAbnormalMetrics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthSummaryWidget;
