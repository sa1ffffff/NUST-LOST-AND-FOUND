-- Add status column to lost_items table (same as found_items)
ALTER TABLE public.lost_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Update existing lost items to be approved (so they remain visible)
UPDATE public.lost_items SET status = 'approved' WHERE status IS NULL;