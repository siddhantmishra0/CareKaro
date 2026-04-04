import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MedicationRecord {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  time_of_day: string[] | null;
  taken_at: string;
}

const PatientMedicationReminder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('medication_records')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const todayMeds = medications.filter(m => isToday(parseISO(m.taken_at)));
  const upcomingMeds = medications.slice(0, 3);

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
              <Skeleton key={i} className="h-12 w-full" />
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
              <Pill className="h-5 w-5 text-primary" />
              Medication Tracker
            </CardTitle>
            <CardDescription>Your medication schedule</CardDescription>
          </div>
          <Badge variant={todayMeds.length > 0 ? "default" : "secondary"}>
            {todayMeds.length} today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {medications.length === 0 ? (
          <div className="text-center py-4">
            <Pill className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No medications tracked yet
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/health-tools")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </div>
        ) : (
          <>
            {upcomingMeds.map((med) => {
              const takenToday = isToday(parseISO(med.taken_at));
              
              return (
                <div 
                  key={med.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${takenToday ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}>
                      {takenToday ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{med.medication_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage && `${med.dosage}`}
                        {med.frequency && ` • ${med.frequency}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(med.taken_at), "MMM d")}
                    </p>
                    {med.time_of_day && med.time_of_day.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {med.time_of_day.slice(0, 2).map((time, i) => (
                          <Badge key={i} variant="outline" className="text-xs px-1">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => navigate("/health-tools")}
            >
              View All Medications
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientMedicationReminder;
