-- Create tables for new health tools

-- Men's health: Testosterone records
CREATE TABLE public.testosterone_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_testosterone NUMERIC,
  free_testosterone NUMERIC,
  testosterone_unit TEXT DEFAULT 'ng/dL',
  notes TEXT,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testosterone_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own testosterone records" ON public.testosterone_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own testosterone records" ON public.testosterone_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own testosterone records" ON public.testosterone_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own testosterone records" ON public.testosterone_records FOR DELETE USING (auth.uid() = user_id);

-- Men's health: Libido tracking
CREATE TABLE public.libido_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  libido_level INTEGER CHECK (libido_level >= 1 AND libido_level <= 10),
  mood TEXT,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_hours NUMERIC,
  exercise_done BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.libido_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own libido records" ON public.libido_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own libido records" ON public.libido_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own libido records" ON public.libido_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own libido records" ON public.libido_records FOR DELETE USING (auth.uid() = user_id);

-- Men's/Women's health: Generic health assessments for various conditions
CREATE TABLE public.health_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL, -- 'erectile_dysfunction', 'prostate', 'pcos', 'menopause', 'hormone', 'vaginal_infection'
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER,
  severity TEXT,
  answers JSONB,
  ai_analysis TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health assessments" ON public.health_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own health assessments" ON public.health_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own health assessments" ON public.health_assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own health assessments" ON public.health_assessments FOR DELETE USING (auth.uid() = user_id);

-- Alcohol & Smoking Tracker
CREATE TABLE public.substance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  substance_type TEXT NOT NULL, -- 'alcohol', 'smoking'
  quantity NUMERIC,
  unit TEXT, -- 'drinks', 'cigarettes', etc.
  trigger_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.substance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own substance records" ON public.substance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own substance records" ON public.substance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own substance records" ON public.substance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own substance records" ON public.substance_records FOR DELETE USING (auth.uid() = user_id);

-- Pregnancy: Contraction Timer
CREATE TABLE public.contraction_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contraction_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contraction records" ON public.contraction_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contraction records" ON public.contraction_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contraction records" ON public.contraction_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contraction records" ON public.contraction_records FOR DELETE USING (auth.uid() = user_id);

-- Pregnancy: Kick Counter
CREATE TABLE public.kick_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  kick_count INTEGER DEFAULT 0,
  target_kicks INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kick_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kick records" ON public.kick_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own kick records" ON public.kick_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own kick records" ON public.kick_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own kick records" ON public.kick_records FOR DELETE USING (auth.uid() = user_id);

-- Vision Health Tracker
CREATE TABLE public.vision_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  left_eye_vision TEXT,
  right_eye_vision TEXT,
  screen_time_hours NUMERIC,
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vision records" ON public.vision_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own vision records" ON public.vision_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vision records" ON public.vision_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vision records" ON public.vision_records FOR DELETE USING (auth.uid() = user_id);

-- Fitness Records
CREATE TABLE public.fitness_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  distance_km NUMERIC,
  steps INTEGER,
  heart_rate_avg INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fitness records" ON public.fitness_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fitness records" ON public.fitness_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fitness records" ON public.fitness_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fitness records" ON public.fitness_records FOR DELETE USING (auth.uid() = user_id);