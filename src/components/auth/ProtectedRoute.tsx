import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
      return;
    }

    if (user) {
      // Check if user has completed their profile (has gender set)
      const checkProfile = async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("gender")
            .eq("user_id", user.id)
            .single();

          // If no profile or no gender set, redirect to complete profile
          // Skip if already on complete-profile page
          if ((!profile || !profile.gender) && location.pathname !== "/auth/complete-profile") {
            navigate("/auth/complete-profile");
          } else {
            setProfileComplete(true);
          }
        } catch (error) {
          // No profile exists, redirect to complete profile
          if (location.pathname !== "/auth/complete-profile") {
            navigate("/auth/complete-profile");
          }
        } finally {
          setCheckingProfile(false);
        }
      };

      checkProfile();
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Allow access to complete-profile page even if profile is not complete
  if (location.pathname === "/auth/complete-profile") {
    return <>{children}</>;
  }

  if (!profileComplete) {
    return null;
  }

  return <>{children}</>;
};
