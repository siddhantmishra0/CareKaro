import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorReport } from "@/services/doctorService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Eye, EyeOff, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface PatientSummary {
  patientId: string;
  reportCount: number;
  lastReport: DoctorReport;
  unreadCount: number;
}

const DoctorPatientQueueWidget = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatientQueue();
    }
  }, [user]);

  const fetchPatientQueue = async () => {
    if (!user) return;
    
    try {
      const profile = await doctorService.getDoctorProfile(user.id);
      if (profile) {
        const reports = await doctorService.getDoctorReports(profile.id);
        
        // Group by patient
        const patientMap = new Map<string, DoctorReport[]>();
        reports.forEach(report => {
          const existing = patientMap.get(report.patient_id) || [];
          existing.push(report);
          patientMap.set(report.patient_id, existing);
        });

        // Convert to summaries
        const summaries: PatientSummary[] = [];
        patientMap.forEach((patientReports, patientId) => {
          const sortedReports = patientReports.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          summaries.push({
            patientId,
            reportCount: patientReports.length,
            lastReport: sortedReports[0],
            unreadCount: patientReports.filter(r => !r.is_read).length
          });
        });

        // Sort by most recent activity
        summaries.sort((a, b) => 
          new Date(b.lastReport.created_at).getTime() - new Date(a.lastReport.created_at).getTime()
        );

        setPatients(summaries.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching patient queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (id: string) => {
    return id.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Patients
            </CardTitle>
            <CardDescription>Patients you've sent reports to</CardDescription>
          </div>
          <Badge variant="secondary">
            {patients.length} patients
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No patients yet. Send your first report!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => (
              <div 
                key={patient.patientId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(patient.patientId)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground font-mono">
                      PAT-{patient.patientId.substring(0, 8).toUpperCase()}
                    </p>
                    {patient.unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        {patient.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(patient.lastReport.created_at), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span>{patient.reportCount} report{patient.reportCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorPatientQueueWidget;
