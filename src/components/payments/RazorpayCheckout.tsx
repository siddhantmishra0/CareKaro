import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Smartphone, Building2, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateSubscription, type PlanName } from "@/services/subscriptionService";
import { useQueryClient } from "@tanstack/react-query";

interface RazorpayCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number; // in INR
  period: string;
}

type PaymentMethod = "card" | "upi" | "netbanking";
type PaymentStep = "method" | "details" | "processing" | "success";

const RazorpayCheckout = ({ open, onOpenChange, planName, amount, period }: RazorpayCheckoutProps) => {
  const [step, setStep] = useState<PaymentStep>("method");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reset = () => {
    setStep("method");
    setMethod("card");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setUpiId("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const simulatePayment = () => {
    setStep("processing");
    setTimeout(async () => {
      try {
        const lastFour = method === "card" ? cardNumber.replace(/\s/g, "").slice(-4) : undefined;
        const methodLabel = method === "card" ? "Card" : method === "upi" ? "UPI" : "Net Banking";
        await updateSubscription(planName as PlanName, amount, period, methodLabel, lastFour);
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        setStep("success");
        toast({
          title: "Payment Successful! 🎉",
          description: `You've subscribed to ${planName}`,
        });
      } catch (err) {
        setStep("details");
        toast({
          title: "Payment Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }, 2500);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const canPay =
    (method === "card" && cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length === 3) ||
    (method === "upi" && upiId.includes("@")) ||
    method === "netbanking";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Header styled like Razorpay */}
        <div className="bg-[#072654] text-white -m-6 mb-0 p-5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wide">CareKaro</p>
              <p className="text-2xl font-bold mt-1">₹{amount}<span className="text-sm font-normal text-blue-200">/{period}</span></p>
            </div>
            <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
              DEMO MODE
            </Badge>
          </div>
          <p className="text-sm text-blue-200 mt-1">{planName}</p>
        </div>

        {step === "method" && (
          <div className="pt-4 space-y-3">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-base">Select Payment Method</DialogTitle>
            </DialogHeader>
            {([
              { id: "card" as const, icon: CreditCard, label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay" },
              { id: "upi" as const, icon: Smartphone, label: "UPI", sub: "Google Pay, PhonePe, Paytm" },
              { id: "netbanking" as const, icon: Building2, label: "Net Banking", sub: "All major banks" },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); setStep("details"); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                  "hover:border-primary hover:bg-accent"
                )}
              >
                <m.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "details" && (
          <div className="pt-4 space-y-4">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" onClick={() => setStep("method")}>
              ← Change method
            </Button>

            {method === "card" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Card Number</Label>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry</Label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CVV</Label>
                    <Input
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "upi" && (
              <div className="space-y-1.5">
                <Label className="text-xs">UPI ID</Label>
                <Input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {method === "netbanking" && (
              <div className="space-y-2">
                <Label className="text-xs">Select Bank</Label>
                {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                  <button
                    key={bank}
                    onClick={simulatePayment}
                    className="w-full text-left text-sm p-2.5 rounded border hover:border-primary hover:bg-accent transition-colors"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}

            {method !== "netbanking" && (
              <Button className="w-full" disabled={!canPay} onClick={simulatePayment}>
                Pay ₹{amount}
              </Button>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment...</p>
            <p className="text-xs text-muted-foreground">Demo mode — no real charge</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-emerald-500" />
            <div>
              <h3 className="text-lg font-bold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {planName} activated (Demo)
              </p>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              This is a simulated payment. No real transaction occurred.
            </p>
            <Button onClick={handleClose} className="mt-2">Continue to Dashboard</Button>
          </div>
        )}

        {step !== "success" && step !== "processing" && (
          <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secured by Razorpay (Demo)
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RazorpayCheckout;
