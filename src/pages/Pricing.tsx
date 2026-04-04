import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Star, FlaskConical, UserCheck, CheckCircle2 } from "lucide-react";
import RazorpayCheckout from "@/components/payments/RazorpayCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

// Map display plan names to internal plan names
const PLAN_NAME_MAP: Record<string, string> = {
  "Discovery Plan": "Free",
  "Pro": "Standard",
  "Family Care Plan": "Premium",
};
const plans = [
  {
    name: "Discovery Plan",
    price: "₹0",
    period: "forever",
    description: "Best for: First-time users & students",
    features: [
      "Upload up to 5 lab reports/month",
      "Basic AI explanation (doctor-friendly language)",
      "Key health trend charts",
      "Red-flag highlights (non-diagnostic)",
      "Email support",
      "30-day report history"
    ],
    cta: "Try Free - No Card Required",
    buttonVariant: "outline" as const,
    buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
  },
  {
    name: "Pro",
    price: "₹199",
    period: "month",
    description: "Best for: Individuals with ongoing health conditions",
    features: [
      "Unlimited lab & report uploads",
      "Advanced AI insights with clinical context",
      "Complete health trend tracking (HbA1c, Lipids, TSH, etc.)",
      "Early red-flag alerts (guideline-based)",
      "Specialist & test recommendations",
      "Priority email support",
      "Unlimited report history",
      "Export & share reports (PDF)"
    ],
    popular: true,
    note: "Designed with doctors. AI does not replace medical consultation.",
    cta: "Upgrade to Pro",
    buttonVariant: "default" as const,
    buttonClass: "bg-blue-500 hover:bg-blue-600"
  },
  {
    name: "Family Care Plan",
    price: "₹499",
    period: "month",
    description: "Best for: Parents, children & chronic care families",
    features: [
      "Everything in Pro",
      "Up to 5 family member profiles",
      "Shared family dashboard",
      "Family wise health trends",
      "Priority phone/WhatsApp support",
      "Dedicated care coordinator",
      "Custom health summaries for doctor visits"
    ],
    cta: "Protect Your Family's Health",
    buttonVariant: "outline" as const,
    buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
  }
];

const trustIndicators = [
  {
    icon: Star,
    text: "Trusted by 1,000+ users",
    color: "text-yellow-500"
  },
  {
    icon: FlaskConical,
    text: "Supports reports from 100+ labs",
    color: "text-emerald-500"
  },
  {
    icon: UserCheck,
    text: "Reviewed by doctors",
    color: "text-blue-500"
  }
];

const Pricing = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number; period: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan: currentPlan } = useSubscription();

  const PLAN_HIERARCHY: Record<string, number> = { Free: 0, Standard: 1, Premium: 2 };

  const getButtonState = (displayName: string) => {
    const internalName = PLAN_NAME_MAP[displayName] || displayName;
    const planLevel = PLAN_HIERARCHY[internalName] ?? 0;
    const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0;

    if (user && internalName === currentPlan) return "current";
    if (user && planLevel < currentLevel) return "downgrade";
    return "available";
  };

  const getButtonLabel = (displayName: string, originalCta: string) => {
    const state = getButtonState(displayName);
    if (state === "current") return "Current Plan";
    if (state === "downgrade") return "Current: " + currentPlan;
    if (!user && PLAN_NAME_MAP[displayName] === "Free") return "Try Free - No Card Required";
    if (user && PLAN_NAME_MAP[displayName] === "Free") return "Current Base Plan";
    return originalCta;
  };

  const handleSelectPlan = (name: string, amount: number, period: string) => {
    if (amount === 0) {
      if (!user) navigate("/auth/signup");
      return;
    }
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to subscribe to a paid plan.", variant: "destructive" });
      navigate("/auth/login");
      return;
    }
    const internalName = name;
    if (internalName === currentPlan) {
      toast({ title: "Already Subscribed", description: `You're already on the ${currentPlan} plan.` });
      return;
    }
    setSelectedPlan({ name, amount, period });
    setCheckoutOpen(true);
  };

  return (
    <Layout showSidebar={false}>
      <SEOHead title="Pricing" description="Choose the right CareKaro plan for your health management needs. Free and premium options available." path="/pricing" />
      <div className="py-20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your health management needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Column 1: Discovery Plan + Medical Disclaimer */}
            <div className="flex flex-col gap-6">
              <Card className="border-2 flex flex-col border-border flex-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plans[0].name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    {plans[0].description}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="text-5xl font-bold text-foreground">{plans[0].price}</span>
                    <span className="text-muted-foreground ml-2">/ {plans[0].period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <ul className="space-y-3">
                    {plans[0].features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  {getButtonState(plans[0].name) === "current" || (user && currentPlan !== "Free") ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground">
                      {currentPlan === "Free" && <><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Current Plan</>}
                      {currentPlan !== "Free" && "Included in your plan"}
                    </div>
                  ) : !user ? (
                    <Button 
                      className={`w-full ${plans[0].buttonClass}`}
                      variant={plans[0].buttonVariant}
                      onClick={() => handleSelectPlan(plans[0].name, 0, plans[0].period)}
                    >
                      {plans[0].cta}
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Current Plan
                    </div>
                  )}
                </CardFooter>
              </Card>
              
              {/* Medical Safety Disclaimer */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">
                      Medical Safety Disclaimer
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      CareKaro provides AI-assisted health insights for education and awareness only. 
                      It does not diagnose or replace a registered medical practitioner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Pro Plan (Most Popular) */}
            <div className="flex flex-col gap-6">
              <Card className="border-2 flex flex-col relative border-primary shadow-lg flex-1 mt-0 md:-mt-4">
                <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold rounded-t-lg absolute top-0 left-0 right-0 -translate-y-full">
                  Most Popular
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plans[1].name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    {plans[1].description}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="text-5xl font-bold text-foreground">{plans[1].price}</span>
                    <span className="text-muted-foreground ml-2">/ {plans[1].period}</span>
                  </div>
                  {plans[1].note && (
                    <p className="text-xs text-muted-foreground mt-3 bg-muted p-2 rounded">
                      {plans[1].note}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <ul className="space-y-3">
                    {plans[1].features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  {currentPlan === "Standard" && user ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" /> Current Plan
                    </div>
                  ) : currentPlan === "Premium" && user ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground">
                      Included in Family Care
                    </div>
                  ) : (
                    <Button 
                      className={`w-full ${plans[1].buttonClass}`}
                      variant={plans[1].buttonVariant}
                      onClick={() => handleSelectPlan("Standard", 199, plans[1].period)}
                    >
                      {plans[1].cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Column 3: Family Care Plan + Trust Indicators */}
            <div className="flex flex-col gap-6">
              <Card className="border-2 flex flex-col border-border flex-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plans[2].name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    {plans[2].description}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="text-5xl font-bold text-foreground">{plans[2].price}</span>
                    <span className="text-muted-foreground ml-2">/ {plans[2].period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <ul className="space-y-3">
                    {plans[2].features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  {currentPlan === "Premium" && user ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" /> Current Plan
                    </div>
                  ) : (
                    <Button 
                      className={`w-full ${plans[2].buttonClass}`}
                      variant={plans[2].buttonVariant}
                      onClick={() => handleSelectPlan("Premium", 499, plans[2].period)}
                    >
                      {plans[2].cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Trust Indicators */}
              <div className="bg-muted border-2 border-border rounded-lg p-6">
                <div className="space-y-4">
                  {trustIndicators.map((indicator, index) => {
                    const IconComponent = indicator.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <IconComponent className={`h-6 w-6 ${indicator.color} flex-shrink-0`} />
                        <span className="text-sm font-medium text-muted-foreground">
                          {indicator.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              All plans include secure, HIPAA-compliant data storage and end-to-end encryption
            </p>
            <p className="text-sm text-muted-foreground">
              Need a custom enterprise solution? <a href="/contact" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </div>
      {selectedPlan && (
        <RazorpayCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          planName={selectedPlan.name}
          amount={selectedPlan.amount}
          period={selectedPlan.period}
        />
      )}
    </Layout>
  );
};

export default Pricing;
