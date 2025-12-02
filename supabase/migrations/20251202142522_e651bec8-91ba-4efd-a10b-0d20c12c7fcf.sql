-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create found items" ON public.found_items;

-- Create a PERMISSIVE INSERT policy (default is permissive)
CREATE POLICY "Anyone can create found items"
ON public.found_items
FOR INSERT
TO public
WITH CHECK (true);

-- Also fix the DELETE policies that have "OR true" bypass
DROP POLICY IF EXISTS "Admins can delete found items" ON public.found_items;
CREATE POLICY "Admins can delete found items"
ON public.found_items
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete lost items" ON public.lost_items;
CREATE POLICY "Admins can delete lost items"
ON public.lost_items
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));