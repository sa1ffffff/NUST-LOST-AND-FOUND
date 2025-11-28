-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add status column to found_items
ALTER TABLE public.found_items 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update RLS policies for found_items
DROP POLICY IF EXISTS "Anyone can view found items" ON public.found_items;

-- Regular users can only view approved items
CREATE POLICY "Users can view approved found items"
ON public.found_items
FOR SELECT
TO authenticated
USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));

-- Admins can view all items
CREATE POLICY "Admins can view all found items"
ON public.found_items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update found items
CREATE POLICY "Admins can update found items"
ON public.found_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add notified column to item_matches to track if email was sent
ALTER TABLE public.item_matches
ADD COLUMN notified BOOLEAN DEFAULT false;

-- Create index for faster status queries
CREATE INDEX idx_found_items_status ON public.found_items(status);