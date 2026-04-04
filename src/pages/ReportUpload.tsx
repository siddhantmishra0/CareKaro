import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileText, X, CalendarIcon, AlertCircle } from "lucide-react";
import UploadProgress from "@/components/reports/UploadProgress";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { storageService } from "@/lib/storage";
import { databaseService } from "@/services/database";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// File validation schema
const uploadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  reportType: z.enum(["blood_test", "ecg", "xray", "mri", "ct_scan", "ultrasound", "other"]),
  reportDate: z.date().optional(),
  file: z.custom<File>((val) => val instanceof File, "File is required")
    .refine((file) => file.size <= 50 * 1024 * 1024, "File size must be less than 50MB")
    .refine(
      (file) => [
        "application/pdf",
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/webp",
        "image/tiff"
      ].includes(file.type),
      "Only PDF and image files (JPG, PNG, WEBP, TIFF) are allowed"
    ),
});

const ReportUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState<string>("");
  const [reportDate, setReportDate] = useState<Date>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const validateForm = () => {
    try {
      uploadSchema.parse({
        title,
        reportType,
        reportDate,
        file: selectedFile,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload reports",
        variant: "destructive"
      });
      navigate("/auth/login");
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create report record first
      const reportId = crypto.randomUUID();
      
      setUploadProgress(20);

      // Upload file to storage
      const uploadResult = await storageService.uploadMedicalReport(
        user.id,
        reportId,
        selectedFile
      );

      setUploadProgress(60);

      // Create database record
      await databaseService.medicalReports.create({
        id: reportId,
        user_id: user.id,
        title: title.trim(),
        report_type: reportType as any,
        status: "processing",
        file_url: uploadResult.path,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        report_date: reportDate?.toISOString().split('T')[0] || null,
        ai_summary: null,
        key_findings: null,
        has_critical_findings: false,
      });

      setUploadProgress(80);

      // Trigger AI analysis
      try {
        const { error: analysisError } = await supabase.functions.invoke('analyze-medical-report', {
          body: { reportId }
        });

        if (analysisError) {
          console.error('Analysis initiation error:', analysisError);
          toast({
            title: "Analysis Queued",
            description: "Your report was uploaded successfully. Analysis will be processed shortly.",
            variant: "default"
          });
        }
      } catch (analysisError) {
        console.error('Analysis request failed:', analysisError);
        // Don't fail the upload if analysis request fails
      }

      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "Upload Successful",
          description: "Your report has been uploaded and is being analyzed. You'll be notified when it's ready."
        });
        navigate("/dashboard");
      }, 500);

    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout showSidebar>
      <SEOHead title="Upload Report" description="Upload your medical reports for AI-powered analysis. Supports blood tests, ECGs, X-rays, MRIs, and more." path="/upload" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Medical Report</h1>
            <p className="text-muted-foreground mt-1">Upload your medical documents for AI-powered analysis</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Provide information about your medical report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Blood Test Results"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type *</Label>
                  <Select value={reportType} onValueChange={setReportType} disabled={isUploading}>
                    <SelectTrigger id="report-type" className={errors.reportType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_test">Blood Test</SelectItem>
                      <SelectItem value="ecg">ECG</SelectItem>
                      <SelectItem value="xray">X-Ray</SelectItem>
                      <SelectItem value="mri">MRI Scan</SelectItem>
                      <SelectItem value="ct_scan">CT Scan</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.reportType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.reportType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Report Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !reportDate && "text-muted-foreground"
                        )}
                        disabled={isUploading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportDate ? format(reportDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reportDate}
                        onSelect={setReportDate}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer",
                  isDragging && "border-primary bg-primary/5 scale-105",
                  !isDragging && "hover:border-primary hover:bg-accent/50",
                  errors.file && "border-destructive"
                )}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setTitle("");
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground">
                        {isDragging ? "Drop your file here" : "Drag and drop your file here"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported formats: PDF, JPG, PNG, WEBP, TIFF (max 50MB)
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileChange}
                        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/tiff"
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>Browse Files</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              {errors.file && (
                <p className="text-sm text-destructive flex items-center gap-1 justify-center">
                  <AlertCircle className="h-3 w-3" />
                  {errors.file}
                </p>
              )}

              {isUploading && selectedFile && (
                <UploadProgress progress={uploadProgress} fileName={selectedFile.name} />
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || !reportType || !title || isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Upload Report"}
                </Button>
                {selectedFile && !isUploading && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setTitle("");
                      setReportType("");
                      setReportDate(undefined);
                      setErrors({});
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Important Information
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your report will be analyzed using AI technology</li>
                  <li>Analysis typically takes 2-5 minutes</li>
                  <li>You'll receive a notification when it's ready</li>
                  <li>All data is encrypted and HIPAA compliant</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReportUpload;
