import { supabase } from "@/integrations/supabase/client";

export type PlanName = "Free" | "Standard" | "Premium";

export interface Subscription {
  plan: PlanName;
  price: number;
  period: string;
  startedAt: string;
  nextBillingDate: string;
  paymentMethod?: string;
  lastFourDigits?: string;
}

export interface BillingRecord {
  id: string;
  invoiceId: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

const defaultSubscription: Subscription = {
  plan: "Free",
  price: 0,
  period: "month",
  startedAt: new Date().toISOString(),
  nextBillingDate: getNextBillingDate(),
};

function getNextBillingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString();
}

export async function getSubscription(): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return defaultSubscription;

  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return defaultSubscription;

  return {
    plan: data.plan as PlanName,
    price: data.price,
    period: data.period,
    startedAt: data.started_at,
    nextBillingDate: data.next_billing_date,
    paymentMethod: data.payment_method ?? undefined,
    lastFourDigits: data.last_four_digits ?? undefined,
  };
}

export async function updateSubscription(
  plan: PlanName,
  price: number,
  period: string,
  paymentMethod?: string,
  lastFourDigits?: string
): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();
  const nextBilling = getNextBillingDate();

  const row = {
    user_id: user.id,
    plan,
    price,
    period,
    payment_method: paymentMethod ?? null,
    last_four_digits: lastFourDigits ?? null,
    started_at: now,
    next_billing_date: nextBilling,
    updated_at: now,
  };

  // Upsert on user_id unique constraint
  const { error } = await (supabase as any)
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });

  if (error) throw error;

  // Add billing record for paid plans
  if (price > 0) {
    const prev = await getSubscription();
    const action = prev.plan === "Free" ? "Upgrade" : prev.plan === plan ? "Renewal" : `${prev.plan} → ${plan}`;
    const count = (await getBillingHistory()).length + 1;
    const invoiceId = `INV-${String(count).padStart(3, "0")}`;

    await (supabase as any).from("billing_history").insert({
      user_id: user.id,
      invoice_id: invoiceId,
      description: `${plan} Plan - ${action}`,
      amount: price,
      status: "paid",
    });
  }

  return {
    plan,
    price,
    period,
    startedAt: now,
    nextBillingDate: nextBilling,
    paymentMethod: paymentMethod ?? undefined,
    lastFourDigits: lastFourDigits ?? undefined,
  };
}

export async function getBillingHistory(): Promise<BillingRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from("billing_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    date: row.created_at,
    description: row.description,
    amount: row.amount,
    status: row.status,
  }));
}
