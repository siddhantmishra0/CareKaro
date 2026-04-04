import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { authService } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await authService.signIn(data.email, data.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error(
            "We couldn't sign you in. Please check your email and password, or use 'Forgot password?' to reset it.",
            {
              duration: 5000,
              description: "If you don't have an account, please sign up first.",
            }
          );
        } else if (error.message.includes("Email not confirmed")) {
          toast.error(
            "Email not verified",
            {
              duration: 6000,
              description: "Please check your inbox and click the verification link we sent you.",
            }
          );
        } else if (error.message.includes("Too many requests")) {
          toast.error(
            "Too many login attempts",
            {
              duration: 5000,
              description: "Please wait a few minutes before trying again.",
            }
          );
        } else {
          toast.error(
            "Sign in failed",
            {
              duration: 4000,
              description: error.message || "Please try again later.",
            }
          );
        }
        return;
      }

      if (authData.user) {
        toast.success("Welcome back!", {
          description: "You've been signed in successfully.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(
        "Connection error",
        {
          duration: 4000,
          description: "Please check your internet connection and try again.",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to access your health dashboard"
    >
      <SocialLoginButtons />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    to="/auth/reset-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  Remember me for 30 days
                </FormLabel>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/auth/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </AuthForm>
  );
};

export default Login;
