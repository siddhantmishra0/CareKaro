import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { format } from "date-fns";

// Initialize pdfMake with fonts
(pdfMake as any).vfs = pdfFonts;

interface ExportColumn {
  header: string;
  accessor: string;
  format?: (value: any) => string;
}

interface ExportOptions {
  title: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  filename: string;
}

export const exportToCSV = ({ title, columns, data, filename }: ExportOptions) => {
  const headers = columns.map((col) => col.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.accessor];
        const formatted = col.format ? col.format(value) : value;
        // Escape commas and quotes in CSV
        const escaped = String(formatted ?? "").replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = ({ title, columns, data, filename }: ExportOptions) => {
  // Prepare table headers
  const tableHeaders = columns.map((col) => ({
    text: col.header,
    style: "tableHeader",
    fillColor: "#2563EB",
    color: "#FFFFFF",
  }));

  // Prepare table body
  const tableBody = data.map((row, rowIndex) =>
    columns.map((col) => {
      const value = row[col.accessor];
      const formattedValue = col.format ? col.format(value) : String(value ?? "-");
      return {
        text: formattedValue,
        fillColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
      };
    })
  );

  // Calculate column widths - distribute evenly
  const columnWidths = columns.map(() => "*");

  const docDefinition = {
    pageSize: "A4" as const,
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    content: [
      // Title
      {
        text: title,
        style: "title",
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      // Export date
      {
        text: `Exported on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`,
        style: "subtitle",
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      // Table
      {
        table: {
          headerRows: 1,
          widths: columnWidths,
          body: [tableHeaders, ...tableBody],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#E2E8F0",
          vLineColor: () => "#E2E8F0",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
    ],
    footer: (currentPage: number, pageCount: number) => ({
      text: `CareKaro Health Export - Page ${currentPage} of ${pageCount}`,
      alignment: "center" as const,
      style: "footer",
      margin: [0, 20, 0, 0] as [number, number, number, number],
    }),
    styles: {
      title: {
        fontSize: 18,
        bold: true,
        color: "#2563EB",
      },
      subtitle: {
        fontSize: 10,
        color: "#64748B",
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
      },
      footer: {
        fontSize: 8,
        color: "#94A3B8",
      },
    },
    defaultStyle: {
      fontSize: 9,
    },
  };

  pdfMake.createPdf(docDefinition).download(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Pre-configured export functions for each health tool
export const exportWeightRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Weight & BMI Records",
    filename: "weight_bmi_records",
    columns: [
      { header: "Date", accessor: "recorded_at", format: (v) => format(new Date(v), "MMM d, yyyy") },
      { header: "Weight (kg)", accessor: "weight" },
      { header: "Height (cm)", accessor: "height" },
      { header: "BMI", accessor: "bmi" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportSleepRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Sleep Quality Records",
    filename: "sleep_records",
    columns: [
      { header: "Date", accessor: "sleep_date", format: (v) => format(new Date(v), "MMM d, yyyy") },
      { header: "Bedtime", accessor: "bedtime", format: (v) => v || "-" },
      { header: "Wake Time", accessor: "wake_time", format: (v) => v || "-" },
      { header: "Duration (hrs)", accessor: "duration_hours", format: (v) => v?.toFixed(1) || "-" },
      { header: "Quality (1-5)", accessor: "quality_rating", format: (v) => v || "-" },
      { header: "Interruptions", accessor: "interruptions" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportMentalHealthRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Mental Health Check-ins",
    filename: "mental_health_checkins",
    columns: [
      { header: "Date", accessor: "checkin_date", format: (v) => format(new Date(v), "MMM d, yyyy") },
      { header: "Mood (1-10)", accessor: "mood_rating" },
      { header: "Anxiety (1-10)", accessor: "anxiety_level" },
      { header: "Stress (1-10)", accessor: "stress_level" },
      { header: "Energy (1-10)", accessor: "energy_level" },
      { header: "Sleep Quality", accessor: "sleep_quality" },
      { header: "Symptoms", accessor: "symptoms", format: (v) => v?.join(", ") || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportPeriodRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Period & Menstrual Records",
    filename: "period_records",
    columns: [
      { header: "Start Date", accessor: "start_date", format: (v) => format(new Date(v), "MMM d, yyyy") },
      { header: "End Date", accessor: "end_date", format: (v) => v ? format(new Date(v), "MMM d, yyyy") : "-" },
      { header: "Flow Intensity", accessor: "flow_intensity", format: (v) => v || "-" },
      { header: "Symptoms", accessor: "symptoms", format: (v) => v?.join(", ") || "-" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportWaterRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Water Intake Records",
    filename: "water_intake_records",
    columns: [
      { header: "Date", accessor: "intake_date", format: (v) => format(new Date(v), "MMM d, yyyy") },
      { header: "Amount (ml)", accessor: "intake_ml" },
      { header: "Drink Type", accessor: "drink_type", format: (v) => v || "water" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportBloodPressureRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Blood Pressure Records",
    filename: "blood_pressure_records",
    columns: [
      { header: "Date", accessor: "recorded_at", format: (v) => format(new Date(v), "MMM d, yyyy h:mm a") },
      { header: "Systolic (mmHg)", accessor: "systolic" },
      { header: "Diastolic (mmHg)", accessor: "diastolic" },
      { header: "Pulse (bpm)", accessor: "pulse", format: (v) => v || "-" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};

export const exportMedicationRecords = (records: any[]) => {
  const options: ExportOptions = {
    title: "Medication Records",
    filename: "medication_records",
    columns: [
      { header: "Date/Time", accessor: "taken_at", format: (v) => format(new Date(v), "MMM d, yyyy h:mm a") },
      { header: "Medication", accessor: "medication_name" },
      { header: "Dosage", accessor: "dosage", format: (v) => v || "-" },
      { header: "Frequency", accessor: "frequency", format: (v) => v?.replace(/_/g, " ") || "-" },
      { header: "Time of Day", accessor: "time_of_day", format: (v) => v?.join(", ") || "-" },
      { header: "Notes", accessor: "notes", format: (v) => v || "-" },
    ],
    data: records,
  };
  return options;
};
