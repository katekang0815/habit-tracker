-- Add order_index column to habits table
ALTER TABLE public.habits 
ADD COLUMN order_index INTEGER;

-- Set default order_index values based on creation order
UPDATE public.habits 
SET order_index = row_number() OVER (PARTITION BY user_id ORDER BY created_at)
WHERE order_index IS NULL;

-- Make order_index NOT NULL with default value
ALTER TABLE public.habits 
ALTER COLUMN order_index SET NOT NULL,
ALTER COLUMN order_index SET DEFAULT 0;