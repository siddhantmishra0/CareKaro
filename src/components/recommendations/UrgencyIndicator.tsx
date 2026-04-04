import { Badge } from "@/components/ui/badge";

interface UrgencyIndicatorProps {
  urgency: string;
}

const UrgencyIndicator = ({ urgency }: UrgencyIndicatorProps) => {
  const getUrgencyStyles = (level: string) => {
    switch (level) {
      case "high":
        return { variant: "destructive" as const, label: "Urgent" };
      case "medium":
        return { variant: "default" as const, label: "Recommended" };
      case "low":
        return { variant: "secondary" as const, label: "Routine" };
      default:
        return { variant: "secondary" as const, label: "Routine" };
    }
  };

  const { variant, label } = getUrgencyStyles(urgency);

  return <Badge variant={variant}>{label}</Badge>;
};

export default UrgencyIndicator;
