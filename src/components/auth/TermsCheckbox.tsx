import { useState } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const TermsCheckbox = ({ checked, onCheckedChange }: TermsCheckboxProps) => {
  const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false);

  return (
    <>
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="mt-1"
        />
        <Label
          htmlFor="terms"
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          I agree to the{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , and I understand the{" "}
          <button
            type="button"
            onClick={() => setShowMedicalDisclaimer(true)}
            className="text-primary hover:underline"
          >
            medical disclaimer
          </button>
        </Label>
      </div>

      <Dialog open={showMedicalDisclaimer} onOpenChange={setShowMedicalDisclaimer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medical Disclaimer</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Important Medical Information:</strong>
                </p>
                <p>
                  CareKaro provides AI-powered health insights and analysis for informational purposes only. 
                  Our service is not intended to replace professional medical advice, diagnosis, or treatment.
                </p>
                <p>
                  <strong>Please note:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Always consult with qualified healthcare professionals for medical decisions</li>
                  <li>Never disregard professional medical advice or delay seeking it because of information provided by CareKaro</li>
                  <li>In case of medical emergencies, contact emergency services immediately</li>
                  <li>AI analysis may not be 100% accurate and should be verified by healthcare providers</li>
                  <li>CareKaro does not provide medical diagnoses or treatment recommendations</li>
                </ul>
                <p className="text-muted-foreground">
                  By using CareKaro, you acknowledge that you understand and accept these limitations.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowMedicalDisclaimer(false)} className="w-full">
            I Understand
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
