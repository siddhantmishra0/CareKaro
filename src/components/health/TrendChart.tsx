import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertCircle } from "lucide-react";

interface Metric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string | null;
  created_at: string | null;
  reference_range_min: number | null;
  reference_range_max: number | null;
  is_abnormal: boolean | null;
}

interface TrendChartProps {
  metrics: Metric[];
  selectedParameter: string | null;
  isLoading: boolean;
}

const TrendChart = ({ metrics, selectedParameter, isLoading }: TrendChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedParameter || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
          <CardDescription>No data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {!selectedParameter 
                ? "Select a health parameter to view trends"
                : "No data available for the selected time range"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedMetrics = [...metrics].sort(
    (a, b) => new Date(a.recorded_at || a.created_at || "").getTime() - 
              new Date(b.recorded_at || b.created_at || "").getTime()
  );

  const chartData = sortedMetrics.map(metric => ({
    date: format(new Date(metric.recorded_at || metric.created_at || ""), "MMM dd"),
    fullDate: format(new Date(metric.recorded_at || metric.created_at || ""), "MMM dd, yyyy"),
    value: metric.metric_value,
    isAbnormal: metric.is_abnormal,
  }));

  const unit = metrics[0]?.metric_unit || "";
  const refMin = metrics[0]?.reference_range_min;
  const refMax = metrics[0]?.reference_range_max;

  const formatParameterName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const chartConfig = {
    value: {
      label: `${formatParameterName(selectedParameter)} (${unit})`,
      color: "hsl(var(--primary))"
    }
  };

  const hasAbnormalValues = metrics.some(m => m.is_abnormal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {formatParameterName(selectedParameter)} Trend
        </CardTitle>
        <CardDescription>
          {metrics.length} reading{metrics.length !== 1 ? 's' : ''} over the selected period
          {hasAbnormalValues && (
            <span className="flex items-center gap-1 text-destructive mt-1">
              <AlertCircle className="h-3 w-3" />
              Contains abnormal values
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                label={{ value: unit, angle: -90, position: 'insideLeft', style: { fill: "hsl(var(--muted-foreground))" } }}
              />
              {refMin !== null && (
                <ReferenceLine 
                  y={refMin} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ value: "Min", position: "right", fill: "hsl(var(--muted-foreground))" }}
                />
              )}
              {refMax !== null && (
                <ReferenceLine 
                  y={refMax} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ value: "Max", position: "right", fill: "hsl(var(--muted-foreground))" }}
                />
              )}
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.isAbnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
