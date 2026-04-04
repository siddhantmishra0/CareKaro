import { Activity, AlertTriangle, Stethoscope, Droplets, Thermometer, TestTube } from "lucide-react";

// IIEF-5 for Erectile Dysfunction
export const erectileDysfunctionConfig = {
  type: "erectile_dysfunction",
  title: "Erectile Dysfunction Assessment",
  description: "IIEF-5 based clinical assessment",
  icon: Activity,
  questions: [
    {
      id: "q1",
      text: "How do you rate your confidence that you could get and keep an erection?",
      options: [
        { value: 1, label: "Very low" },
        { value: 2, label: "Low" },
        { value: 3, label: "Moderate" },
        { value: 4, label: "High" },
        { value: 5, label: "Very high" },
      ],
    },
    {
      id: "q2",
      text: "When you had erections with sexual stimulation, how often were your erections hard enough for penetration?",
      options: [
        { value: 1, label: "Almost never or never" },
        { value: 2, label: "A few times (less than half)" },
        { value: 3, label: "Sometimes (about half)" },
        { value: 4, label: "Most times (more than half)" },
        { value: 5, label: "Almost always or always" },
      ],
    },
    {
      id: "q3",
      text: "During sexual intercourse, how often were you able to maintain your erection after penetration?",
      options: [
        { value: 1, label: "Almost never or never" },
        { value: 2, label: "A few times (less than half)" },
        { value: 3, label: "Sometimes (about half)" },
        { value: 4, label: "Most times (more than half)" },
        { value: 5, label: "Almost always or always" },
      ],
    },
    {
      id: "q4",
      text: "During sexual intercourse, how difficult was it to maintain your erection to completion?",
      options: [
        { value: 1, label: "Extremely difficult" },
        { value: 2, label: "Very difficult" },
        { value: 3, label: "Difficult" },
        { value: 4, label: "Slightly difficult" },
        { value: 5, label: "Not difficult" },
      ],
    },
    {
      id: "q5",
      text: "When you attempted sexual intercourse, how often was it satisfactory for you?",
      options: [
        { value: 1, label: "Almost never or never" },
        { value: 2, label: "A few times (less than half)" },
        { value: 3, label: "Sometimes (about half)" },
        { value: 4, label: "Most times (more than half)" },
        { value: 5, label: "Almost always or always" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score >= 22) return { severity: "No ED", message: "No erectile dysfunction" };
    if (score >= 17) return { severity: "Mild", message: "Mild erectile dysfunction" };
    if (score >= 12) return { severity: "Mild-Moderate", message: "Mild to moderate ED" };
    if (score >= 8) return { severity: "Moderate", message: "Moderate erectile dysfunction" };
    return { severity: "Severe", message: "Severe erectile dysfunction" };
  },
};

// IPSS for Prostate Symptoms
export const prostateConfig = {
  type: "prostate",
  title: "Prostate Symptom Checker",
  description: "IPSS-based assessment",
  icon: Stethoscope,
  questions: [
    {
      id: "q1",
      text: "Over the past month, how often have you had a sensation of not emptying your bladder completely?",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Less than 1 in 5 times" },
        { value: 2, label: "Less than half the time" },
        { value: 3, label: "About half the time" },
        { value: 4, label: "More than half the time" },
        { value: 5, label: "Almost always" },
      ],
    },
    {
      id: "q2",
      text: "How often have you had to urinate again less than two hours after you finished urinating?",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Less than 1 in 5 times" },
        { value: 2, label: "Less than half the time" },
        { value: 3, label: "About half the time" },
        { value: 4, label: "More than half the time" },
        { value: 5, label: "Almost always" },
      ],
    },
    {
      id: "q3",
      text: "How often have you found you stopped and started again several times when you urinated?",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Less than 1 in 5 times" },
        { value: 2, label: "Less than half the time" },
        { value: 3, label: "About half the time" },
        { value: 4, label: "More than half the time" },
        { value: 5, label: "Almost always" },
      ],
    },
    {
      id: "q4",
      text: "How often have you found it difficult to postpone urination?",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Less than 1 in 5 times" },
        { value: 2, label: "Less than half the time" },
        { value: 3, label: "About half the time" },
        { value: 4, label: "More than half the time" },
        { value: 5, label: "Almost always" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score <= 7) return { severity: "Mild", message: "Mild symptoms" };
    if (score <= 19) return { severity: "Moderate", message: "Moderate symptoms - consider consulting a doctor" };
    return { severity: "Severe", message: "Severe symptoms - please consult a urologist" };
  },
};

// PCOS Risk Assessment
export const pcosConfig = {
  type: "pcos",
  title: "PCOS Risk Assessment",
  description: "Polycystic ovary syndrome evaluation",
  icon: AlertTriangle,
  questions: [
    {
      id: "q1",
      text: "How regular are your menstrual cycles?",
      options: [
        { value: 0, label: "Regular (21-35 days)" },
        { value: 1, label: "Slightly irregular (occasionally varies)" },
        { value: 2, label: "Often irregular (varies frequently)" },
        { value: 3, label: "Very irregular or absent periods" },
      ],
    },
    {
      id: "q2",
      text: "Do you experience excess hair growth on face, chest, or back?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Mild" },
        { value: 2, label: "Moderate" },
        { value: 3, label: "Severe" },
      ],
    },
    {
      id: "q3",
      text: "Do you have acne or oily skin that is difficult to manage?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Mild" },
        { value: 2, label: "Moderate" },
        { value: 3, label: "Severe" },
      ],
    },
    {
      id: "q4",
      text: "Have you experienced unexplained weight gain, especially around the abdomen?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Slight" },
        { value: 2, label: "Noticeable" },
        { value: 3, label: "Significant" },
      ],
    },
    {
      id: "q5",
      text: "Do you have thinning hair or hair loss on your head?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Mild" },
        { value: 2, label: "Moderate" },
        { value: 3, label: "Severe" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score <= 4) return { severity: "Low Risk", message: "Low risk of PCOS" };
    if (score <= 9) return { severity: "Moderate Risk", message: "Moderate risk - consider consulting a gynecologist" };
    return { severity: "High Risk", message: "Higher risk - please consult a specialist" };
  },
};

// Vaginal Infection Checker
export const vaginalInfectionConfig = {
  type: "vaginal_infection",
  title: "Vaginal Infection Checker",
  description: "Symptom-based assessment",
  icon: Droplets,
  questions: [
    {
      id: "q1",
      text: "Do you have unusual vaginal discharge?",
      options: [
        { value: 0, label: "No unusual discharge" },
        { value: 1, label: "Slightly different than normal" },
        { value: 2, label: "Noticeably unusual (color, texture, amount)" },
        { value: 3, label: "Significantly abnormal discharge" },
      ],
    },
    {
      id: "q2",
      text: "Do you experience vaginal itching or burning?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Mild occasional itching" },
        { value: 2, label: "Moderate persistent itching" },
        { value: 3, label: "Severe itching affecting daily life" },
      ],
    },
    {
      id: "q3",
      text: "Is there any unusual odor?",
      options: [
        { value: 0, label: "No unusual odor" },
        { value: 1, label: "Slightly unusual" },
        { value: 2, label: "Noticeably strong or fishy" },
        { value: 3, label: "Very strong unpleasant odor" },
      ],
    },
    {
      id: "q4",
      text: "Do you experience pain or discomfort during urination or intercourse?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Mild discomfort" },
        { value: 2, label: "Moderate pain" },
        { value: 3, label: "Significant pain" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score <= 2) return { severity: "Normal", message: "Symptoms appear normal" };
    if (score <= 6) return { severity: "Possible Infection", message: "Possible infection - consider seeing a doctor" };
    return { severity: "Likely Infection", message: "Likely infection - please consult a healthcare provider" };
  },
};

// Menopause Tracker
export const menopauseConfig = {
  type: "menopause",
  title: "Menopause Tracker",
  description: "Track perimenopause symptoms",
  icon: Thermometer,
  questions: [
    {
      id: "q1",
      text: "How often do you experience hot flashes?",
      options: [
        { value: 0, label: "Never" },
        { value: 1, label: "Rarely (few times a month)" },
        { value: 2, label: "Sometimes (few times a week)" },
        { value: 3, label: "Frequently (daily)" },
        { value: 4, label: "Very frequently (multiple times daily)" },
      ],
    },
    {
      id: "q2",
      text: "How would you rate your sleep quality?",
      options: [
        { value: 0, label: "Excellent" },
        { value: 1, label: "Good" },
        { value: 2, label: "Fair - some night sweats or insomnia" },
        { value: 3, label: "Poor - frequent sleep disruption" },
        { value: 4, label: "Very poor - severe sleep problems" },
      ],
    },
    {
      id: "q3",
      text: "Do you experience mood changes or irritability?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Occasionally" },
        { value: 2, label: "Regularly" },
        { value: 3, label: "Frequently" },
        { value: 4, label: "Constantly" },
      ],
    },
    {
      id: "q4",
      text: "How are your menstrual cycles?",
      options: [
        { value: 0, label: "Regular as before" },
        { value: 1, label: "Slightly irregular" },
        { value: 2, label: "Very irregular" },
        { value: 3, label: "Very infrequent (few times a year)" },
        { value: 4, label: "Stopped completely" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score <= 4) return { severity: "Minimal Symptoms", message: "Minimal menopausal symptoms" };
    if (score <= 8) return { severity: "Mild", message: "Mild perimenopause symptoms" };
    if (score <= 12) return { severity: "Moderate", message: "Moderate symptoms - consider discussing with doctor" };
    return { severity: "Significant", message: "Significant symptoms - consult your healthcare provider" };
  },
};

// Hormone Insights (general hormone symptom checker)
export const hormoneConfig = {
  type: "hormone",
  title: "Hormone Insights",
  description: "Hormone balance assessment",
  icon: TestTube,
  questions: [
    {
      id: "q1",
      text: "Do you experience fatigue or low energy levels?",
      options: [
        { value: 0, label: "Rarely" },
        { value: 1, label: "Sometimes" },
        { value: 2, label: "Often" },
        { value: 3, label: "Most of the time" },
      ],
    },
    {
      id: "q2",
      text: "Do you have unexplained weight changes?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Slight fluctuations" },
        { value: 2, label: "Noticeable changes" },
        { value: 3, label: "Significant unexplained changes" },
      ],
    },
    {
      id: "q3",
      text: "How are your mood and emotional well-being?",
      options: [
        { value: 0, label: "Stable and good" },
        { value: 1, label: "Occasional mood swings" },
        { value: 2, label: "Frequent mood changes" },
        { value: 3, label: "Significant mood issues" },
      ],
    },
    {
      id: "q4",
      text: "Do you experience skin or hair changes?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Minor changes" },
        { value: 2, label: "Noticeable changes" },
        { value: 3, label: "Significant changes" },
      ],
    },
    {
      id: "q5",
      text: "Do you have issues with libido or sexual function?",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Slight decrease" },
        { value: 2, label: "Noticeable decrease" },
        { value: 3, label: "Significant issues" },
      ],
    },
  ],
  getResult: (score: number) => {
    if (score <= 4) return { severity: "Balanced", message: "Hormones appear balanced" };
    if (score <= 9) return { severity: "Mild Imbalance", message: "Possible mild imbalance" };
    return { severity: "Possible Imbalance", message: "Consider hormone testing with your doctor" };
  },
};
