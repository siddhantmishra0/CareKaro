import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Image, Download, MessageCircle, Globe, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { medicalFilesService, MedicalFile } from "@/services/medicalFilesService";
import { toast } from "sonner";

const MedicalFilesWidget = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFiles = async () => {
      try {
        const data = await medicalFilesService.getMyFiles();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching medical files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [user]);

  const handleDownload = async (file: MedicalFile) => {
    try {
      setDownloadingId(file.id);
      const url = await medicalFilesService.getSignedUrl(file.file_path);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to generate download link");
    } finally {
      setDownloadingId(null);
    }
  };

  const doctorFiles = files.filter((f) => f.uploaded_by_role === "doctor");
  const patientFiles = files.filter((f) => f.uploaded_by_role === "patient");

  const FileIcon = ({ type }: { type: string | null }) => {
    if (type === "image") return <Image className="h-5 w-5 text-primary" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const SourceBadge = ({ source }: { source: string }) => (
    <Badge variant="outline" className="text-xs gap-1">
      {source === "whatsapp" ? (
        <><MessageCircle className="h-3 w-3" /> WhatsApp</>
      ) : (
        <><Globe className="h-3 w-3" /> Website</>
      )}
    </Badge>
  );

  const FileList = ({ items, emptyText }: { items: MedicalFile[]; emptyText: string }) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <FileIcon type={file.file_type} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{file.file_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <SourceBadge source={file.source} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                  {file.file_size && (
                    <span className="text-xs text-muted-foreground">
                      {(file.file_size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
                {file.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{file.description}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(file)}
              disabled={downloadingId === file.id}
            >
              {downloadingId === file.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Doctor Uploads
          </CardTitle>
          <CardDescription>Files uploaded by your doctors</CardDescription>
        </CardHeader>
        <CardContent>
          <FileList items={doctorFiles} emptyText="No files from doctors yet" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Uploads
          </CardTitle>
          <CardDescription>Files you've uploaded via website or WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <FileList items={patientFiles} emptyText="No files uploaded yet" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalFilesWidget;
