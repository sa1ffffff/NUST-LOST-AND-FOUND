-- Create found_items table
CREATE TABLE public.found_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date_found DATE NOT NULL,
  contact TEXT,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lost_items table
CREATE TABLE public.lost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date_lost DATE NOT NULL,
  contact TEXT,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (community lost & found)
CREATE POLICY "Anyone can view found items" 
ON public.found_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create found items" 
ON public.found_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view lost items" 
ON public.lost_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create lost items" 
ON public.lost_items 
FOR INSERT 
WITH CHECK (true);

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true);

-- Create storage policies
CREATE POLICY "Anyone can upload item images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Anyone can view item images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'item-images');