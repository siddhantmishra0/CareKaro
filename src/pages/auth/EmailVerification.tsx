import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AuthForm } from "@/components/auth/AuthForm";
import { Mail, CheckCircle } from "lucide-react";

const EmailVerification = () => {
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setIsResending(true);
    
    try {
      // TODO: Implement actual resend verification email logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast({
        title: "Verification email sent",
        description: "Please check your inbox.",
      });
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthForm
      title="Verify your email"
      description="We've sent a verification link to your email address"
    >
      <div className="flex flex-col items-center space-y-6 py-8">
        <div className="rounded-full bg-accent p-4">
          <Mail className="h-12 w-12 text-accent-foreground" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Check your inbox
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            We've sent a verification email to the address you provided. Click the link in the email to verify your account and get started with CareKaro.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>

          <Button
            onClick={() => navigate("/auth/login")}
            className="w-full"
          >
            Continue to sign in
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>Didn't receive the email? Check your spam folder or try resending.</p>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Need help?{" "}
        <Link to="/contact" className="text-primary hover:underline font-medium">
          Contact support
        </Link>
      </div>
    </AuthForm>
  );
};

export default EmailVerification;
