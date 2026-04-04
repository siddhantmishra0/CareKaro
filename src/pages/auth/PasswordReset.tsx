import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { ArrowLeft, Mail } from "lucide-react";
import { authService } from "@/lib/auth";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const PasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await authService.resetPassword(data.email);
      
      if (error) {
        toast.error(error.message || "Failed to send reset email. Please try again.");
        return;
      }

      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthForm
        title="Check your email"
        description="We've sent password reset instructions to your email"
      >
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="rounded-full bg-accent p-4">
            <Mail className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent an email to <strong>{form.getValues("email")}</strong> with instructions to reset your password.
            </p>
            <p className="text-sm text-muted-foreground">
              If you don't receive the email within a few minutes, please check your spam folder.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setEmailSent(false)}
            className="w-full"
          >
            Try another email
          </Button>
        </div>

        <div className="text-center text-sm">
          <Link to="/auth/login" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email address and we'll send you a reset link"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link to="/auth/login" className="text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthForm>
  );
};

export default PasswordReset;
