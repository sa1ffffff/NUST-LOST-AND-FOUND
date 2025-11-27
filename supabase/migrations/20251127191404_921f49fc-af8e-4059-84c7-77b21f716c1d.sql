-- Create table to store item matches
CREATE TABLE IF NOT EXISTS public.item_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lost_item_id UUID NOT NULL,
  found_item_id UUID NOT NULL,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_lost_item FOREIGN KEY (lost_item_id) REFERENCES public.lost_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_found_item FOREIGN KEY (found_item_id) REFERENCES public.found_items(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.item_matches ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view matches
CREATE POLICY "Anyone can view item matches"
ON public.item_matches
FOR SELECT
USING (true);

-- Allow anyone to create matches
CREATE POLICY "Anyone can create item matches"
ON public.item_matches
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_item_matches_lost_item ON public.item_matches(lost_item_id);
CREATE INDEX idx_item_matches_found_item ON public.item_matches(found_item_id);
CREATE INDEX idx_item_matches_score ON public.item_matches(match_score DESC);