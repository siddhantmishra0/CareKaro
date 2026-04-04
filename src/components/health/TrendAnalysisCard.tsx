import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Activity, AlertCircle, CheckCircle } from "lucide-react";

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

interface TrendAnalysisCardProps {
  metrics: Metric[];
  selectedParameter: string | null;
}

const TrendAnalysisCard = ({ metrics, selectedParameter }: TrendAnalysisCardProps) => {
  if (!selectedParameter || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription>Analysis of your health trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select a health parameter and date range to view AI-powered insights about your health trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedMetrics = [...metrics].sort(
    (a, b) => new Date(a.recorded_at || a.created_at || "").getTime() - 
              new Date(b.recorded_at || b.created_at || "").getTime()
  );

  const firstValue = sortedMetrics[0].metric_value;
  const lastValue = sortedMetrics[sortedMetrics.length - 1].metric_value;
  const change = ((lastValue - firstValue) / firstValue) * 100;
  const isIncreasing = change > 5;
  const isDecreasing = change < -5;
  const isStable = !isIncreasing && !isDecreasing;

  const abnormalCount = metrics.filter(m => m.is_abnormal).length;
  const abnormalPercentage = (abnormalCount / metrics.length) * 100;

  const average = metrics.reduce((sum, m) => sum + m.metric_value, 0) / metrics.length;
  const unit = metrics[0].metric_unit;

  const formatParameterName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTrendIcon = () => {
    if (isIncreasing) return <TrendingUp className="h-5 w-5 text-primary" />;
    if (isDecreasing) return <TrendingDown className="h-5 w-5 text-accent" />;
    return <Activity className="h-5 w-5 text-primary" />;
  };

  const getTrendDescription = () => {
    if (isIncreasing) {
      return `Your ${formatParameterName(selectedParameter).toLowerCase()} has increased by ${Math.abs(change).toFixed(1)}% over the selected period.`;
    }
    if (isDecreasing) {
      return `Your ${formatParameterName(selectedParameter).toLowerCase()} has decreased by ${Math.abs(change).toFixed(1)}% over the selected period.`;
    }
    return `Your ${formatParameterName(selectedParameter).toLowerCase()} has remained relatively stable with only minor fluctuations.`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTrendIcon()}
          AI Insights
        </CardTitle>
        <CardDescription>Analysis of {formatParameterName(selectedParameter)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Overall Trend</p>
          <p className="text-sm text-muted-foreground">
            {getTrendDescription()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Average Value</p>
            <p className="text-lg font-semibold">
              {average.toFixed(1)} {unit}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Latest Value</p>
            <p className="text-lg font-semibold">
              {lastValue.toFixed(1)} {unit}
            </p>
          </div>
        </div>

        {abnormalPercentage > 0 ? (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium">
                {abnormalCount} of {metrics.length} reading{metrics.length !== 1 ? 's' : ''} outside normal range
              </p>
              <p className="text-xs text-muted-foreground">
                Consider consulting with a healthcare professional about these abnormal readings.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg">
            <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              All readings are within the normal range. Continue monitoring regularly and maintain your current health practices.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisCard;
