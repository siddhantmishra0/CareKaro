import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface AuthFormProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthForm = ({ title, description, children }: AuthFormProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-full bg-primary p-2">
            <Heart className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">CareKaro</span>
        </Link>

        <Card className="shadow-medical">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Protected by enterprise-grade encryption and HIPAA compliant
        </div>
      </div>
    </div>
  );
};
