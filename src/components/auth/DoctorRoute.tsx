import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService } from "@/services/doctorService";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export const DoctorRoute = ({ children, requireVerified = false }: DoctorRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isDoctor, setIsDoctor] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDoctorStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (requireVerified) {
          const verified = await doctorService.isVerifiedDoctor(user.id);
          setIsDoctor(verified);
        } else {
          const profile = await doctorService.getDoctorProfile(user.id);
          setIsDoctor(!!profile);
        }
      } catch (error) {
        console.error("Error checking doctor status:", error);
        setIsDoctor(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkDoctorStatus();
    }
  }, [user, authLoading, requireVerified]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireVerified && !isDoctor) {
    return <Navigate to="/doctor" replace />;
  }

  return <>{children}</>;
};
