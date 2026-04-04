import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doctorService, DoctorProfile } from "@/services/doctorService";
import { notificationService } from "@/services/notifications";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Send, Loader2, Upload, CalendarIcon, Search, User, X, Plus, MessageCircle 
} from "lucide-react";
import { medicalFilesService } from "@/services/medicalFilesService";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  { value: "prescription", label: "Prescription" },
  { value: "blood_test", label: "Blood Test" },
  { value: "scan", label: "Scan Report" },
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI" },
  { value: "ecg", label: "ECG" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "report", label: "General Report" },
  { value: "other", label: "Other" },
];

interface PatientSearchResult {
  user_id: string;
  display_name: string | null;
  patient_id: string;
  email?: string;
}

const SendReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Risk indicators
  const [riskIndicators, setRiskIndicators] = useState<string[]>([]);
  const [newRiskIndicator, setNewRiskIndicator] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    report_type: "",
    examination_date: null as Date | null,
    observations: "",
    doctor_remarks: "",
    follow_up_advice: "",
  });

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    try {
      const profile = await doctorService.getDoctorProfile(user.id);
      setDoctorProfile(profile);
      
      if (!profile || profile.verification_status !== 'approved') {
        toast.error("You need to be a verified doctor to send reports");
        navigate("/doctor");
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
    }
  };

  const handlePatientSearch = async () => {
    if (patientSearch.length < 2) return;
    
    try {
      setSearching(true);
      const results = await doctorService.searchPatients(patientSearch);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const addRiskIndicator = () => {
    if (newRiskIndicator.trim() && !riskIndicators.includes(newRiskIndicator.trim())) {
      setRiskIndicators([...riskIndicators, newRiskIndicator.trim()]);
      setNewRiskIndicator("");
    }
  };

  const removeRiskIndicator = (index: number) => {
    setRiskIndicators(riskIndicators.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !doctorProfile || !selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    if (!formData.title || !formData.report_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let medicalFileRecord = null;

      // Upload file if present
      if (file) {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `doctor-reports/${doctorProfile.id}/${selectedPatient.user_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-reports')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        fileUrl = filePath;
        fileName = file.name;
        fileSize = file.size;
        setUploading(false);

        // Also create a medical_files record for the unified file system
        try {
          medicalFileRecord = await medicalFilesService.uploadFileFromWebsite(
            user.id,
            file,
            formData.title,
            selectedPatient.user_id
          );
        } catch (mfError) {
          console.error("Failed to create medical_files record:", mfError);
          // Non-blocking — the doctor_report is the primary record
        }
      }

      // Create report
      await doctorService.createReport({
        doctor_id: doctorProfile.id,
        patient_id: selectedPatient.user_id,
        title: formData.title,
        report_type: formData.report_type,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        examination_date: formData.examination_date ? format(formData.examination_date, 'yyyy-MM-dd') : null,
        observations: formData.observations || null,
        doctor_remarks: formData.doctor_remarks || null,
        risk_indicators: riskIndicators.length > 0 ? riskIndicators : null,
        follow_up_advice: formData.follow_up_advice || null,
      });

      // Send email notification to patient
      if (selectedPatient.email) {
        try {
          const reportTypeLabel = REPORT_TYPES.find(t => t.value === formData.report_type)?.label || formData.report_type;
          await notificationService.sendDoctorReportNotification(
            selectedPatient.email,
            selectedPatient.display_name || 'Patient',
            doctorProfile.full_name,
            formData.title,
            reportTypeLabel,
            riskIndicators.length > 0,
            !!formData.follow_up_advice
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      // Send via WhatsApp if opted in and file was uploaded
      if (sendViaWhatsApp && medicalFileRecord) {
        try {
          setSendingWhatsApp(true);
          await medicalFilesService.sendViaWhatsApp(
            selectedPatient.user_id,
            medicalFileRecord.id,
            "doctor_report_notification"
          );
          toast.success("Report sent via WhatsApp!");
        } catch (waError: any) {
          console.error("WhatsApp send failed:", waError);
          toast.error("Report saved but WhatsApp delivery failed. You can retry later.");
        } finally {
          setSendingWhatsApp(false);
        }
      }

      toast.success("Report sent successfully!");
      navigate("/doctor");
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast.error(error.message || "Failed to send report");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Layout showSidebar showFooter={false}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Report to Patient
            </CardTitle>
            <CardDescription>
              Create and send a medical report to a patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Search */}
              <div className="space-y-2">
                <Label>Select Patient *</Label>
                {selectedPatient ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedPatient.display_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground font-mono">{selectedPatient.patient_id}</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name or Patient ID (PAT-XXXXXX)..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePatientSearch())}
                      />
                      <Button type="button" onClick={handlePatientSearch} disabled={searching}>
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <button
                            key={patient.user_id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearchResults([]);
                              setPatientSearch("");
                            }}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="block">{patient.display_name || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground font-mono">{patient.patient_id}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Report Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Blood Test Results"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report_type">Report Type *</Label>
                  <Select
                    value={formData.report_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, report_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Examination Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.examination_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.examination_date ? format(formData.examination_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.examination_date || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, examination_date: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Attach Document</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dcm"
                    onChange={handleFileChange}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  placeholder="Key observations from the examination..."
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor_remarks">Doctor's Remarks</Label>
                <Textarea
                  id="doctor_remarks"
                  placeholder="Your professional remarks and notes..."
                  value={formData.doctor_remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctor_remarks: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Risk Indicators */}
              <div className="space-y-2">
                <Label>Risk Indicators</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a risk indicator..."
                    value={newRiskIndicator}
                    onChange={(e) => setNewRiskIndicator(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRiskIndicator())}
                  />
                  <Button type="button" variant="outline" onClick={addRiskIndicator}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {riskIndicators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {riskIndicators.map((indicator, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-sm"
                      >
                        {indicator}
                        <button type="button" onClick={() => removeRiskIndicator(index)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_advice">Follow-up Advice</Label>
                <Textarea
                  id="follow_up_advice"
                  placeholder="Recommended follow-up actions, tests, or appointments..."
                  value={formData.follow_up_advice}
                  onChange={(e) => setFormData(prev => ({ ...prev, follow_up_advice: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* WhatsApp Option */}
              {file && (
                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="send-whatsapp"
                    checked={sendViaWhatsApp}
                    onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                  />
                  <label htmlFor="send-whatsapp" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    Also send report to patient via WhatsApp
                  </label>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/doctor")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || uploading || sendingWhatsApp}>
                  {loading || uploading || sendingWhatsApp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploading ? "Uploading..." : sendingWhatsApp ? "Sending WhatsApp..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {sendViaWhatsApp ? "Send Report & WhatsApp" : "Send Report"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SendReport;
