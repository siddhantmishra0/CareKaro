-- Create water intake tracking table
CREATE TABLE public.water_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  intake_ml INTEGER NOT NULL,
  drink_type TEXT DEFAULT 'water',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own water records" ON public.water_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own water records" ON public.water_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own water records" ON public.water_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water records" ON public.water_records FOR DELETE USING (auth.uid() = user_id);

-- Create blood pressure tracking table
CREATE TABLE public.blood_pressure_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bp records" ON public.blood_pressure_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bp records" ON public.blood_pressure_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bp records" ON public.blood_pressure_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bp records" ON public.blood_pressure_records FOR DELETE USING (auth.uid() = user_id);

-- Create medication tracking table
CREATE TABLE public.medication_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  time_of_day TEXT[],
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own medication records" ON public.medication_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own medication records" ON public.medication_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medication records" ON public.medication_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medication records" ON public.medication_records FOR DELETE USING (auth.uid() = user_id);