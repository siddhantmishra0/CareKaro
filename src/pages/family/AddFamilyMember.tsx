import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { familyService, InviteCode } from "@/services/familyService";
import { Copy, Share2, MessageCircle, RefreshCw, Users, Clock, Shield, Check, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const AddFamilyMember = () => {
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const generateCode = async () => {
    setLoading(true);
    try {
      const code = await familyService.generateInviteCode();
      setInviteCode(code);
      const expiresAt = new Date(code.expires_at).getTime();
      const calculatedTime = Math.floor((expiresAt - Date.now()) / 1000);
      // Default to 5 minutes if we can't calculate expiry time
      setTimeLeft(isNaN(calculatedTime) || calculatedTime <= 0 ? 300 : calculatedTime);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setInviteCode(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExpiryTime = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const copyCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode.code);
      setCopied(true);
      toast({
        title: "Code Copied",
        description: "The invite code has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (inviteCode) {
      const message = encodeURIComponent(
        `Join my family on CareKaro! Use this code to connect: ${inviteCode.code}\n\nThis code expires in ${formatTime(timeLeft)}.`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const shareLink = async () => {
    if (inviteCode) {
      const shareData = {
        title: 'CareKaro Family Invite',
        text: `Join my family on CareKaro! Use code: ${inviteCode.code}`,
        url: `https://dream-weave-studio-84.vercel.app/family/join?code=${inviteCode.code}`,
      };
      
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          copyCode();
        }
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "The invite link has been copied to your clipboard.",
        });
      }
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/family" className="text-primary hover:underline text-sm">
          ← Back to Family Dashboard
        </Link>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Add Family Member</CardTitle>
          <CardDescription className="text-base">
            Generate a secure invite code to connect with your loved ones
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security notice */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Your family member will need to create a CareKaro account and enter this code to connect. 
              They'll be able to see your health updates based on your permission settings.
            </p>
          </div>

          {!inviteCode ? (
            <Button 
              onClick={generateCode} 
              disabled={loading}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Invite Code"
              )}
            </Button>
          ) : (
            <div className="space-y-6">
              {/* Code display */}
              <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Your invite code</p>
                
                {showQR ? (
                  <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeSVG 
                        value={`https://carekaro.lovable.app/family/join?code=${inviteCode.code}`}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scan to join family
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQR(false)}
                      className="text-primary"
                    >
                      Show Code Instead
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-4xl font-bold tracking-[0.5em] text-primary">
                      {inviteCode.code}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQR(true)}
                      className="mt-3 text-muted-foreground hover:text-primary"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  </>
                )}
                
                <div className="flex flex-col items-center gap-1 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={timeLeft < 60 ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {formatTime(timeLeft)} remaining
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Expires at {formatExpiryTime(inviteCode.expires_at)}
                  </span>
                </div>
              </div>

              {/* Deep link section */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium mb-2">Share invite link</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-background rounded border text-xs font-mono truncate text-muted-foreground">
                    carekaro.lovable.app/family/join?code={inviteCode.code}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const link = `https://carekaro.lovable.app/family/join?code=${inviteCode.code}`;
                      await navigator.clipboard.writeText(link);
                      toast({
                        title: "Link Copied",
                        description: "The invite link has been copied. Share it with your family member!",
                      });
                    }}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  When they open this link, the code will auto-fill
                </p>
              </div>

              {/* Share actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={copyCode}
                  className={cn("h-12 transition-all", copied && "bg-green-50 border-green-500 text-green-600")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2 animate-scale-in" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={shareViaWhatsApp}
                  className="h-12 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  onClick={shareLink}
                  className="h-12"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </div>

              {/* Generate new code */}
              <Button 
                variant="ghost" 
                onClick={generateCode}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Generate New Code
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">How it works:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Share the invite code with your family member</li>
              <li>They'll enter the code on CareKaro to connect with you</li>
              <li>Once connected, you can view each other's health updates</li>
              <li>Manage sharing preferences anytime from the Family Dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFamilyMember;
