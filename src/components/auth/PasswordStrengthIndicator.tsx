import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, text: "", color: "" };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { level: 1, text: "Weak", color: "bg-destructive" };
    } else if (score <= 4) {
      return { level: 2, text: "Fair", color: "bg-warning" };
    } else if (score <= 5) {
      return { level: 3, text: "Good", color: "bg-info" };
    } else {
      return { level: 4, text: "Strong", color: "bg-success" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full bg-muted transition-colors",
              level <= strength.level && strength.color
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className={cn("font-medium", strength.level >= 3 ? "text-success" : "text-warning")}>
          {strength.text}
        </span>
      </p>
    </div>
  );
};
