import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PlanName } from "@/services/subscriptionService";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: PlanName;
  description?: string;
}

const planLabels: Record<PlanName, string> = {
  Free: "Discovery",
  Standard: "Pro",
  Premium: "Family Care",
};

const UpgradePrompt = ({ feature, requiredPlan, description }: UpgradePromptProps) => {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col items-center text-center py-12 px-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Upgrade to Unlock {feature}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {description ||
            `This feature is available on the ${planLabels[requiredPlan]} plan and above. Upgrade now to get access.`}
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/pricing">
            View Plans <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
