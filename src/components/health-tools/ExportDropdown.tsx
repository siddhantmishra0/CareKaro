import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportHealth";
import { toast } from "sonner";

interface ExportDropdownProps {
  getExportOptions: () => {
    title: string;
    filename: string;
    columns: { header: string; accessor: string; format?: (value: any) => string }[];
    data: Record<string, any>[];
  };
  disabled?: boolean;
}

export function ExportDropdown({ getExportOptions, disabled }: ExportDropdownProps) {
  const handleExportCSV = () => {
    try {
      const options = getExportOptions();
      if (!options.data.length) {
        toast.error("No data to export");
        return;
      }
      exportToCSV(options);
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = () => {
    try {
      const options = getExportOptions();
      if (!options.data.length) {
        toast.error("No data to export");
        return;
      }
      exportToPDF(options);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
