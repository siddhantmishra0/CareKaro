import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill, Search, AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface SafetyResult {
  medication: string;
  category: string;
  safety: "safe" | "caution" | "avoid" | "unknown";
  description: string;
  alternatives?: string[];
}

export const SafeMedicinesChecker = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [medication, setMedication] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<SafetyResult[]>([]);

  const checkMedication = async () => {
    if (!medication.trim()) {
      toast.error("Please enter a medication name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-tools", {
        body: {
          toolType: "pregnancy_medication_check",
          userId: user?.id,
          data: { medication: medication.trim() },
        },
      });

      if (error) throw error;

      const safetyResult: SafetyResult = {
        medication: medication.trim(),
        category: data.category || "Unknown",
        safety: data.safety || "unknown",
        description: data.description || "No information available",
        alternatives: data.alternatives,
      };

      setResult(safetyResult);
      setRecentSearches((prev) => [safetyResult, ...prev.slice(0, 4)]);
    } catch (error) {
      toast.error("Failed to check medication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSafetyIcon = (safety: string) => {
    switch (safety) {
      case "safe":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "caution":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "avoid":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <HelpCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getSafetyBadge = (safety: string) => {
    switch (safety) {
      case "safe":
        return <Badge className="bg-green-500">Generally Safe</Badge>;
      case "caution":
        return <Badge className="bg-yellow-500">Use with Caution</Badge>;
      case "avoid":
        return <Badge variant="destructive">Avoid</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground text-sm">Safe Medicines Checker</h3>
                <Badge variant="default" className="text-xs">AI Powered</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pregnancy-safe medication guide
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-accent" />
            Safe Medicines Checker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Important Disclaimer</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This tool provides general information only. Always consult your doctor or pharmacist 
                  before taking any medication during pregnancy.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="medication" className="sr-only">Medication Name</Label>
              <Input
                id="medication"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="Enter medication name (e.g., Acetaminophen, Ibuprofen)"
                onKeyDown={(e) => e.key === "Enter" && checkMedication()}
              />
            </div>
            <Button onClick={checkMedication} disabled={loading}>
              {loading ? (
                "Checking..."
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Check
                </>
              )}
            </Button>
          </div>

          {result && (
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getSafetyIcon(result.safety)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-lg">{result.medication}</h3>
                      {getSafetyBadge(result.safety)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      FDA Category: {result.category}
                    </p>
                    <p className="text-sm">{result.description}</p>
                    {result.alternatives && result.alternatives.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Safer Alternatives:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.alternatives.map((alt, i) => (
                            <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setMedication(alt)}>
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recentSearches.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Recent Searches</h4>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    setMedication(search.medication);
                    setResult(search);
                  }}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSafetyIcon(search.safety)}
                        <span>{search.medication}</span>
                      </div>
                      {getSafetyBadge(search.safety)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg text-center text-sm">
            <div>
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="font-medium">Generally Safe</p>
              <p className="text-xs text-muted-foreground">Low risk based on data</p>
            </div>
            <div>
              <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="font-medium">Use with Caution</p>
              <p className="text-xs text-muted-foreground">Consult doctor first</p>
            </div>
            <div>
              <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="font-medium">Avoid</p>
              <p className="text-xs text-muted-foreground">Known risks</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
