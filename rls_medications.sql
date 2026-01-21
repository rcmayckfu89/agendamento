-- Enable RLS on medications table
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view medications
CREATE POLICY "Medications are viewable by authenticated users" 
ON public.medications FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert, update, delete medications
CREATE POLICY "Medications are editable by authenticated users" 
ON public.medications FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
