import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

const UploadProgress = ({ progress, fileName }: UploadProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {progress < 100 ? `Uploading... ${progress}%` : "Upload complete!"}
          </p>
        </div>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
};

export default UploadProgress;
