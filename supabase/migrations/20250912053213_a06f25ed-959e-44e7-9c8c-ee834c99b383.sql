-- Add order_index column to habits table
ALTER TABLE public.habits 
ADD COLUMN order_index INTEGER;

-- Set default order_index values using a series of updates
DO $$
DECLARE
    habit_rec RECORD;
    current_order INTEGER;
BEGIN
    -- For each user, set order_index based on creation order
    FOR habit_rec IN (
        SELECT DISTINCT user_id FROM public.habits ORDER BY user_id
    ) LOOP
        current_order := 1;
        
        -- Update each habit for this user in creation order
        UPDATE public.habits 
        SET order_index = (
            SELECT row_num FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM public.habits 
                WHERE user_id = habit_rec.user_id
            ) numbered 
            WHERE numbered.id = habits.id
        )
        WHERE user_id = habit_rec.user_id;
    END LOOP;
END $$;

-- Make order_index NOT NULL with default value
ALTER TABLE public.habits 
ALTER COLUMN order_index SET NOT NULL,
ALTER COLUMN order_index SET DEFAULT 0;