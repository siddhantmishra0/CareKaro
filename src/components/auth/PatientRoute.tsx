import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { doctorService } from "@/services/doctorService";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientRouteProps {
  children: ReactNode;
}

export const PatientRoute = ({ children }: PatientRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isPatient, setIsPatient] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPatientStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [isAdmin, isDoctor] = await Promise.all([
          adminService.isAdmin(),
          doctorService.isVerifiedDoctor(user.id),
        ]);
        
        // User is a patient if they are neither admin nor doctor
        setIsPatient(!isAdmin && !isDoctor);
      } catch (error) {
        console.error("Error checking patient status:", error);
        setIsPatient(true); // Default to patient on error
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkPatientStatus();
    }
  }, [user, authLoading]);

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

  // Redirect non-patients to their respective dashboards
  if (!isPatient) {
    return <Navigate to="/doctor" replace />;
  }

  return <>{children}</>;
};
