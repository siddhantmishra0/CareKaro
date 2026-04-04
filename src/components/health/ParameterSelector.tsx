import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";

interface ParameterSelectorProps {
  parameters: string[];
  selectedParameter: string | null;
  onParameterChange: (parameter: string) => void;
}

const ParameterSelector = ({ parameters, selectedParameter, onParameterChange }: ParameterSelectorProps) => {
  const formatParameterName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Health Parameter
      </Label>
      {parameters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No health metrics available yet</p>
      ) : (
        <Select value={selectedParameter || undefined} onValueChange={onParameterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a parameter" />
          </SelectTrigger>
          <SelectContent>
            {parameters.map((param) => (
              <SelectItem key={param} value={param}>
                {formatParameterName(param)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ParameterSelector;
