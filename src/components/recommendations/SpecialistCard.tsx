import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import UrgencyIndicator from "./UrgencyIndicator";
import type { SpecialistRecommendation } from "@/services/database";
import { format } from "date-fns";

interface SpecialistCardProps {
  recommendation: SpecialistRecommendation;
  onAcknowledge: () => void;
  isAcknowledging: boolean;
}

const SpecialistCard = ({ recommendation, onAcknowledge, isAcknowledging }: SpecialistCardProps) => {
  return (
    <Card className={recommendation.is_acknowledged ? "border-muted" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{recommendation.specialty}</CardTitle>
              {recommendation.is_acknowledged && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Acknowledged
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {format(new Date(recommendation.created_at!), "MMM dd, yyyy")}
            </CardDescription>
          </div>
          <UrgencyIndicator urgency={recommendation.urgency} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Reasoning</p>
          <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
        </div>

        {recommendation.recommended_actions && recommendation.recommended_actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended Actions</p>
            <ul className="list-disc list-inside space-y-1">
              {recommendation.recommended_actions.map((action, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.is_acknowledged && recommendation.acknowledged_at && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Acknowledged on {format(new Date(recommendation.acknowledged_at), "MMM dd, yyyy 'at' h:mm a")}
          </div>
        )}

        {!recommendation.is_acknowledged && (
          <Button
            onClick={onAcknowledge}
            disabled={isAcknowledging}
            className="w-full"
          >
            {isAcknowledging ? "Acknowledging..." : "Acknowledge Recommendation"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SpecialistCard;
