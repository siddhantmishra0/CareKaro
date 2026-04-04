-- Create BMI and weight tracking table
CREATE TABLE public.weight_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2),
  bmi DECIMAL(4,1),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create period tracking table
CREATE TABLE public.period_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ovulation predictions table
CREATE TABLE public.ovulation_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  predicted_ovulation_date DATE NOT NULL,
  fertile_window_start DATE NOT NULL,
  fertile_window_end DATE NOT NULL,
  next_period_date DATE,
  cycle_length INTEGER,
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sleep records table
CREATE TABLE public.sleep_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sleep_date DATE NOT NULL,
  bedtime TIME,
  wake_time TIME,
  duration_hours DECIMAL(4,2),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  interruptions INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mental health check-ins table
CREATE TABLE public.mental_health_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  symptoms TEXT[],
  journal_entry TEXT,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create general symptom checker logs
CREATE TABLE public.symptom_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  symptoms TEXT[] NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  duration TEXT,
  ai_analysis TEXT,
  recommendations TEXT[],
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ovulation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weight_records
CREATE POLICY "Users can view their own weight records" ON public.weight_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weight records" ON public.weight_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weight records" ON public.weight_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weight records" ON public.weight_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for period_records
CREATE POLICY "Users can view their own period records" ON public.period_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own period records" ON public.period_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own period records" ON public.period_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own period records" ON public.period_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ovulation_predictions
CREATE POLICY "Users can view their own ovulation predictions" ON public.ovulation_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ovulation predictions" ON public.ovulation_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ovulation predictions" ON public.ovulation_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ovulation predictions" ON public.ovulation_predictions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sleep_records
CREATE POLICY "Users can view their own sleep records" ON public.sleep_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sleep records" ON public.sleep_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep records" ON public.sleep_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep records" ON public.sleep_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for mental_health_checkins
CREATE POLICY "Users can view their own mental health checkins" ON public.mental_health_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mental health checkins" ON public.mental_health_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mental health checkins" ON public.mental_health_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mental health checkins" ON public.mental_health_checkins FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for symptom_assessments
CREATE POLICY "Users can view their own symptom assessments" ON public.symptom_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own symptom assessments" ON public.symptom_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own symptom assessments" ON public.symptom_assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own symptom assessments" ON public.symptom_assessments FOR DELETE USING (auth.uid() = user_id);