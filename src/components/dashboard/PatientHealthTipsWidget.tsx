import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";

interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
}

interface PatientHealthTipsWidgetProps {
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  healthConditions?: string | null;
}

const allHealthTips: HealthTip[] = [
  // General tips
  { id: "1", title: "Stay Hydrated", description: "Drink at least 8 glasses of water daily. Proper hydration helps maintain energy levels and supports kidney function.", category: "Hydration", tags: ["general"] },
  { id: "2", title: "Get Quality Sleep", description: "Aim for 7-9 hours of sleep. Good sleep improves memory, mood, and immune function.", category: "Sleep", tags: ["general"] },
  { id: "3", title: "Move Every Hour", description: "Take a 5-minute walk every hour if you sit for long periods. This improves circulation and reduces fatigue.", category: "Activity", tags: ["general"] },
  { id: "4", title: "Eat More Fiber", description: "Include fiber-rich foods like vegetables, fruits, and whole grains for better digestive health.", category: "Nutrition", tags: ["general"] },
  { id: "5", title: "Practice Deep Breathing", description: "Take 5 deep breaths when feeling stressed. This activates your parasympathetic nervous system.", category: "Mental Health", tags: ["general"] },
  { id: "6", title: "Limit Screen Time Before Bed", description: "Avoid screens 1 hour before sleep. Blue light can disrupt your circadian rhythm.", category: "Sleep", tags: ["general"] },
  { id: "7", title: "Check Your Posture", description: "Sit straight with feet flat on the floor. Good posture prevents back pain and improves breathing.", category: "Posture", tags: ["general"] },
  { id: "8", title: "Wash Hands Frequently", description: "Wash hands for at least 20 seconds to prevent the spread of infections.", category: "Hygiene", tags: ["general"] },
  // Age-specific tips
  { id: "9", title: "Build Strong Bones Early", description: "Calcium and vitamin D are crucial in your younger years. Include dairy, leafy greens, and get sunlight exposure.", category: "Nutrition", tags: ["young"] },
  { id: "10", title: "Prioritize Joint Health", description: "Low-impact exercises like swimming and cycling protect your joints as you age. Supplement with omega-3 fatty acids.", category: "Activity", tags: ["senior"] },
  { id: "11", title: "Monitor Blood Pressure Regularly", description: "After 40, regular blood pressure monitoring helps catch hypertension early. Aim for below 120/80 mmHg.", category: "Heart Health", tags: ["senior"] },
  { id: "12", title: "Eye Exams Matter", description: "Schedule annual eye exams after 50. Early detection of conditions like glaucoma can save your vision.", category: "Prevention", tags: ["senior"] },
  // Gender-specific tips
  { id: "13", title: "Iron-Rich Foods for Energy", description: "Women need more iron due to menstruation. Include spinach, lentils, and red meat in your diet.", category: "Nutrition", tags: ["female"] },
  { id: "14", title: "Bone Density Awareness", description: "Women are at higher risk for osteoporosis. Weight-bearing exercises and calcium help maintain bone strength.", category: "Prevention", tags: ["female"] },
  { id: "15", title: "Prostate Health Awareness", description: "Men over 50 should discuss prostate screening with their doctor. Early detection is key.", category: "Prevention", tags: ["male"] },
  { id: "16", title: "Heart Health Focus", description: "Heart disease is the leading cause of death in men. Regular cardio exercise and a balanced diet reduce risk significantly.", category: "Heart Health", tags: ["male"] },
  // Blood group tips
  { id: "17", title: "Type A: Plant-Forward Diet", description: "Blood type A individuals may benefit from more plant-based foods. Focus on vegetables, fruits, tofu, and whole grains for optimal digestion.", category: "Blood Type", tags: ["blood_A+", "blood_A-"] },
  { id: "18", title: "Type A: Stress Management", description: "Type A individuals tend to have higher cortisol levels. Yoga, tai chi, and meditation can help manage stress effectively.", category: "Blood Type", tags: ["blood_A+", "blood_A-"] },
  { id: "19", title: "Type B: Balanced Diet Benefits", description: "Blood type B does well with a balanced mix of meat, dairy, grains, and vegetables. Include green vegetables and eggs regularly.", category: "Blood Type", tags: ["blood_B+", "blood_B-"] },
  { id: "20", title: "Type B: Stay Active & Creative", description: "Moderate physical activities like hiking, tennis, and swimming suit type B. Mix cardio with creative exercises for best results.", category: "Blood Type", tags: ["blood_B+", "blood_B-"] },
  { id: "21", title: "Type O: High-Protein Focus", description: "Blood type O may thrive on a higher-protein diet with lean meats, fish, and vegetables. Limit grains and dairy if you feel sluggish.", category: "Blood Type", tags: ["blood_O+", "blood_O-"] },
  { id: "22", title: "Type O: Vigorous Exercise", description: "Type O individuals often benefit from intense aerobic exercise like running, cycling, and HIIT to maintain energy and mood.", category: "Blood Type", tags: ["blood_O+", "blood_O-"] },
  { id: "23", title: "Type AB: Mindful Eating", description: "Blood type AB benefits from a mix of A and B diets. Seafood, tofu, dairy, and greens work well. Eat smaller, more frequent meals.", category: "Blood Type", tags: ["blood_AB+", "blood_AB-"] },
  { id: "24", title: "Type AB: Calming Activities", description: "Combine calming exercises like yoga with moderate activity like cycling. Type AB responds well to a blend of relaxation and movement.", category: "Blood Type", tags: ["blood_AB+", "blood_AB-"] },
  { id: "25", title: "Rh-Negative: Immune Awareness", description: "Rh-negative blood types may have different immune sensitivities. Stay on top of vaccinations and discuss your blood type with your doctor.", category: "Blood Type", tags: ["blood_A-", "blood_B-", "blood_AB-", "blood_O-"] },
  // Condition-aware tips
  { id: "26", title: "Manage Blood Sugar Naturally", description: "Choose low-glycemic foods like whole grains, legumes, and non-starchy vegetables. Monitor carb intake and eat at regular intervals.", category: "Diabetes Care", tags: ["condition_diabetes"] },
  { id: "27", title: "Diabetic Foot Care", description: "Check your feet daily for cuts, blisters, or swelling. Wear comfortable shoes and keep feet clean and moisturized.", category: "Diabetes Care", tags: ["condition_diabetes"] },
  { id: "28", title: "Heart-Healthy Eating", description: "Reduce sodium intake to under 2,300mg daily. Choose olive oil over butter, and eat fatty fish like salmon twice a week.", category: "Heart Health", tags: ["condition_heart", "condition_hypertension"] },
  { id: "29", title: "Know Your Numbers", description: "Track your cholesterol, blood pressure, and blood sugar regularly. These key metrics help predict and prevent cardiovascular events.", category: "Heart Health", tags: ["condition_heart", "condition_hypertension", "condition_cholesterol"] },
  { id: "30", title: "Asthma Trigger Awareness", description: "Identify and avoid your asthma triggers — dust, pollen, cold air, and exercise. Always carry your rescue inhaler.", category: "Respiratory", tags: ["condition_asthma"] },
  { id: "31", title: "Thyroid-Friendly Foods", description: "Include iodine-rich foods like seaweed and dairy. Limit soy and cruciferous vegetables if you have hypothyroidism, and take medication consistently.", category: "Thyroid Health", tags: ["condition_thyroid"] },
  { id: "32", title: "Kidney Health Basics", description: "Stay hydrated, limit salt and processed foods, and monitor blood pressure. Regular kidney function tests are essential if you're at risk.", category: "Kidney Health", tags: ["condition_kidney"] },
  { id: "33", title: "Manage Cholesterol Naturally", description: "Increase soluble fiber (oats, beans, apples) and omega-3 fats. Exercise 30 minutes daily and limit saturated fats from fried foods.", category: "Nutrition", tags: ["condition_cholesterol"] },
  { id: "34", title: "Anxiety & Stress Relief", description: "Practice the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. Regular exercise and consistent sleep also reduce anxiety significantly.", category: "Mental Health", tags: ["condition_anxiety", "condition_mental_health"] },
  { id: "35", title: "Anti-Inflammatory Diet", description: "If you have arthritis or chronic inflammation, eat more berries, fatty fish, leafy greens, and turmeric. Avoid refined sugar and processed foods.", category: "Nutrition", tags: ["condition_arthritis", "condition_inflammation"] },
];

const getAge = (dob: string | null | undefined): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const normalizeBloodGroup = (bg: string | null | undefined): string[] => {
  if (!bg) return [];
  const cleaned = bg.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) return [];
  return [`blood_${cleaned}`];
};

const detectConditionTags = (conditions: string | null | undefined): string[] => {
  if (!conditions) return [];
  const text = conditions.toLowerCase();
  const mapping: Record<string, string> = {
    diabetes: "condition_diabetes",
    heart: "condition_heart",
    hypertension: "condition_hypertension",
    "blood pressure": "condition_hypertension",
    cholesterol: "condition_cholesterol",
    asthma: "condition_asthma",
    thyroid: "condition_thyroid",
    kidney: "condition_kidney",
    anxiety: "condition_anxiety",
    depression: "condition_mental_health",
    "mental health": "condition_mental_health",
    arthritis: "condition_arthritis",
    inflammation: "condition_inflammation",
  };
  return Object.entries(mapping)
    .filter(([keyword]) => text.includes(keyword))
    .map(([, tag]) => tag);
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    "Hydration": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Sleep": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Activity": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Nutrition": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "Mental Health": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    "Posture": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "Hygiene": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    "Heart Health": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "Prevention": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    "Blood Type": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    "Diabetes Care": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    "Respiratory": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    "Thyroid Health": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
    "Kidney Health": "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
  };
  return colors[category] || "bg-muted text-muted-foreground";
};

const PatientHealthTipsWidget = ({ gender, dateOfBirth, bloodGroup, healthConditions }: PatientHealthTipsWidgetProps) => {
  const [currentTip, setCurrentTip] = useState<HealthTip | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const personalizedTips = useMemo(() => {
    const age = getAge(dateOfBirth);
    const genderTag = gender?.toLowerCase() === "female" ? "female" : gender?.toLowerCase() === "male" ? "male" : null;
    const ageTag = age !== null ? (age >= 50 ? "senior" : age < 30 ? "young" : null) : null;
    const bloodTags = normalizeBloodGroup(bloodGroup);
    const conditionTags = detectConditionTags(healthConditions);

    return allHealthTips
      .map((tip) => {
        let score = 1;
        if (tip.tags?.includes("general")) score += 1;
        if (genderTag && tip.tags?.includes(genderTag)) score += 3;
        if (ageTag && tip.tags?.includes(ageTag)) score += 3;
        if (bloodTags.some((bt) => tip.tags?.includes(bt))) score += 4;
        if (conditionTags.some((ct) => tip.tags?.includes(ct))) score += 5;
        // Exclude irrelevant gender tips
        if (tip.tags?.includes("female") && genderTag === "male") score = 0;
        if (tip.tags?.includes("male") && genderTag === "female") score = 0;
        return { ...tip, score };
      })
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [gender, dateOfBirth, bloodGroup, healthConditions]);

  const pickRandom = () => {
    const weighted = personalizedTips.flatMap((t) => Array(t.score).fill(t));
    return weighted[Math.floor(Math.random() * weighted.length)] || personalizedTips[0];
  };

  useEffect(() => {
    if (personalizedTips.length > 0) setCurrentTip(pickRandom());
  }, [personalizedTips]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCurrentTip(pickRandom());
      setIsRefreshing(false);
    }, 300);
  };

  if (!currentTip) return null;

  const isPersonalized = currentTip.tags?.some((t) => t !== "general");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Daily Health Tip
            </CardTitle>
            <CardDescription>
              {isPersonalized ? "Personalized tip for you" : "Quick tips for a healthier you"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(currentTip.category)}`}>
                {currentTip.category}
              </span>
              {isPersonalized && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  For you
                </span>
              )}
            </div>
            <h4 className="font-semibold text-foreground mb-1">{currentTip.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentTip.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientHealthTipsWidget;
