import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileImage, File } from "lucide-react";
import { useEffect, useState } from "react";
import { storageService } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentViewerProps {
  fileUrl?: string | null;
  fileName?: string | null;
  /** If true, fileUrl is already a signed URL and won't be re-signed */
  isPreSigned?: boolean;
}

const DocumentViewer = ({ fileUrl, fileName, isPreSigned = false }: DocumentViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!fileUrl) return;
      
      // If URL is already signed, use it directly
      if (isPreSigned) {
        setSignedUrl(fileUrl);
        return;
      }
      
      setLoading(true);
      try {
        const url = await storageService.getSignedUrl(fileUrl, 900);
        if (url) {
          setSignedUrl(url);
        }
      } catch (error) {
        console.error("Error getting signed URL:", error);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [fileUrl, isPreSigned]);

  const getFileIcon = () => {
    if (!fileName) return <File className="h-16 w-16 text-muted-foreground mx-auto" />;
    
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-16 w-16 text-muted-foreground mx-auto" />;
    if (["jpg", "jpeg", "png", "webp", "tiff"].includes(ext || "")) {
      return <FileImage className="h-16 w-16 text-muted-foreground mx-auto" />;
    }
    return <File className="h-16 w-16 text-muted-foreground mx-auto" />;
  };

  const isImage = fileName?.match(/\.(jpg|jpeg|png|webp|tiff)$/i);
  const isPdf = fileName?.endsWith(".pdf");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Original Document</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : !fileUrl || !signedUrl ? (
          <div className="border rounded-lg bg-muted/20 p-8 min-h-[600px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No document available</p>
              <p className="text-sm text-muted-foreground">Upload a report to see it here</p>
            </div>
          </div>
        ) : isImage ? (
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={signedUrl} 
              alt={fileName || "Medical document"} 
              className="w-full h-auto"
            />
          </div>
        ) : isPdf ? (
          <div className="border rounded-lg overflow-hidden">
            <iframe 
              src={signedUrl} 
              className="w-full h-[600px]"
              title={fileName || "Medical document"}
            />
          </div>
        ) : (
          <div className="border rounded-lg bg-muted/20 p-8 min-h-[600px] flex items-center justify-center">
            <div className="text-center space-y-4">
              {getFileIcon()}
              <p className="text-muted-foreground">{fileName}</p>
              <a 
                href={signedUrl} 
                download={fileName}
                className="text-sm text-primary hover:underline"
              >
                Download to view
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
