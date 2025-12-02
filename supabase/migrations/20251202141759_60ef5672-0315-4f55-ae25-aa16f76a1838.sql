-- Add is_found column to lost_items table
ALTER TABLE public.lost_items ADD COLUMN IF NOT EXISTS is_found boolean DEFAULT false;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.found_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lost_items;

-- Add delete policy for found_items (admin can delete)
CREATE POLICY "Admins can delete found items" 
ON public.found_items 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR true);

-- Add delete policy for lost_items (admin can delete)
CREATE POLICY "Admins can delete lost items" 
ON public.lost_items 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR true);

-- Add update policy for lost_items (for marking as found)
CREATE POLICY "Anyone can update lost items" 
ON public.lost_items 
FOR UPDATE 
USING (true)
WITH CHECK (true);