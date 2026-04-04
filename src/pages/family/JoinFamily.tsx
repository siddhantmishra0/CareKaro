import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { familyService, VerifyCodeResult } from "@/services/familyService";
import { Users, Heart, Shield, Check, X, Loader2 } from "lucide-react";

const JoinFamily = () => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifyCodeResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && codeFromUrl.length === 6) {
      setCode(codeFromUrl);
      handleVerify(codeFromUrl);
    }
  }, [searchParams]);

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    if (verifiedData) {
      setVerifiedData(null);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const verifyCode = codeToVerify || code;
    if (verifyCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const result = await familyService.verifyCode(verifyCode);
      setVerifiedData(result);
    } catch (error: any) {
      toast({
        title: "Invalid Code",
        description: error.message || "The code is invalid or has expired.",
        variant: "destructive",
      });
      setVerifiedData(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleConnect = async () => {
    if (!verifiedData) return;

    setConnecting(true);
    try {
      await familyService.connect(
        verifiedData.code_id, 
        verifiedData.inviter_id, 
        verifiedData.inviter_name
      );
      setShowWelcome(true);
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with family member.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  if (showWelcome) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="h-10 w-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">
                Welcome to the Family! 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You're now connected with <span className="font-medium text-foreground">{verifiedData?.inviter_name}</span>. 
                You can view health updates, reminders, and emergencies based on permissions.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <p>You can control what you share from your privacy settings.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={() => navigate('/family')} size="lg" className="min-w-[200px]">
                Go to Family Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/family/preferences')} 
                size="lg"
                className="min-w-[200px]"
              >
                Set Sharing Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Enter Family Code</CardTitle>
          <CardDescription className="text-base">
            Enter the 6-digit code shared by your family member
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Code input */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="text-center text-3xl font-mono tracking-[0.5em] h-16 max-w-[250px]"
                disabled={verifying || connecting}
              />
            </div>

            {!verifiedData && (
              <Button 
                onClick={() => handleVerify()} 
                disabled={code.length !== 6 || verifying}
                className="w-full h-12"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            )}
          </div>

          {/* Verification result */}
          {verifiedData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">You are connecting with</p>
                <p className="text-xl font-semibold text-primary">{verifiedData.inviter_name}</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setVerifiedData(null);
                    setCode("");
                  }}
                  className="flex-1 h-12"
                  disabled={connecting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-1 h-12"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Confirm & Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="border-t pt-6">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Your privacy is protected</p>
                <p>After connecting, you control what health information you share. You can change these settings anytime.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinFamily;