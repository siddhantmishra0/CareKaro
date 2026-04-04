import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Crown, ArrowUpRight, ArrowDownRight, Download, CheckCircle, Loader2 } from "lucide-react";
import RazorpayCheckout from "@/components/payments/RazorpayCheckout";
import { getSubscription, getBillingHistory, type Subscription, type BillingRecord, type PlanName } from "@/services/subscriptionService";

interface PlanInfo {
  name: PlanName;
  price: number;
  period: string;
  features: string[];
}

const plans: PlanInfo[] = [
  {
    name: "Free",
    price: 0,
    period: "month",
    features: ["5 report uploads/month", "Basic AI analysis", "7-day report history"],
  },
  {
    name: "Standard",
    price: 499,
    period: "month",
    features: ["50 report uploads/month", "Advanced AI analysis", "Health trends", "Email support"],
  },
  {
    name: "Premium",
    price: 999,
    period: "month",
    features: ["Unlimited uploads", "Priority AI analysis", "Specialist recommendations", "Family sharing", "Priority support"],
  },
];

const SubscriptionManagement = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [sub, history] = await Promise.all([getSubscription(), getBillingHistory()]);
    setSubscription(sub);
    setBillingHistory(history);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const currentPlan = subscription?.plan ?? "Free";

  const handlePlanAction = (plan: PlanInfo) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleCheckoutClose = (open: boolean) => {
    setCheckoutOpen(open);
    if (!open) loadData(); // refresh after checkout closes
  };

  const getPlanAction = (plan: PlanInfo) => {
    if (plan.name === currentPlan) return null;
    const currentIndex = plans.findIndex((p) => p.name === currentPlan);
    const planIndex = plans.findIndex((p) => p.name === plan.name);
    return planIndex > currentIndex ? "upgrade" : "downgrade";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge className="text-sm px-3 py-1">{currentPlan}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
            <div>
              <p className="text-2xl font-bold text-foreground">
                ₹{subscription?.price ?? 0}
                <span className="text-sm font-normal text-muted-foreground">/{subscription?.period ?? "month"}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Next billing date: {subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : "N/A"}
              </p>
            </div>
            {subscription?.lastFourDigits && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">•••• {subscription.lastFourDigits}</span>
              </div>
            )}
          </div>
          <ul className="mt-4 space-y-1.5">
            {plans
              .find((p) => p.name === currentPlan)
              ?.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-accent" />
                  {f}
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      {/* Change Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
          <CardDescription>Upgrade or downgrade your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const action = getPlanAction(plan);
              const isCurrent = plan.name === currentPlan;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border p-4 transition-colors ${
                    isCurrent ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                  }`}
                >
                  {isCurrent && (
                    <Badge variant="secondary" className="absolute -top-2.5 right-3 text-xs">
                      Current
                    </Badge>
                  )}
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    {plan.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 mt-0.5 text-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {action && (
                    <Button
                      size="sm"
                      variant={action === "upgrade" ? "default" : "outline"}
                      className="w-full mt-4"
                      onClick={() => handlePlanAction(plan)}
                    >
                      {action === "upgrade" ? (
                        <>
                          <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3.5 w-3.5" /> Downgrade
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No billing records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.invoiceId}</TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.date)}</TableCell>
                    <TableCell className="text-sm">{invoice.description}</TableCell>
                    <TableCell className="text-right text-sm font-medium">₹{invoice.amount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {billingHistory.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5" /> Download All Invoices
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedPlan && (
        <RazorpayCheckout
          open={checkoutOpen}
          onOpenChange={handleCheckoutClose}
          planName={selectedPlan.name}
          amount={selectedPlan.price}
          period={selectedPlan.period}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;
