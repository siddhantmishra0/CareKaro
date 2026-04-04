import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecommendationFiltersProps {
  selectedSpecialty: string;
  selectedUrgency: string;
  onSpecialtyChange: (value: string) => void;
  onUrgencyChange: (value: string) => void;
}

const RecommendationFilters = ({
  selectedSpecialty,
  selectedUrgency,
  onSpecialtyChange,
  onUrgencyChange
}: RecommendationFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Specialty</Label>
        <Select value={selectedSpecialty} onValueChange={onSpecialtyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            <SelectItem value="Cardiology">Cardiology</SelectItem>
            <SelectItem value="Hematology">Hematology</SelectItem>
            <SelectItem value="Endocrinology">Endocrinology</SelectItem>
            <SelectItem value="Pulmonology">Pulmonology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Urgency</Label>
        <Select value={selectedUrgency} onValueChange={onUrgencyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="high">Urgent</SelectItem>
            <SelectItem value="medium">Recommended</SelectItem>
            <SelectItem value="low">Routine</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RecommendationFilters;
