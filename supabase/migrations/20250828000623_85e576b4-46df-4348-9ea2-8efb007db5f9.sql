-- Clear all data from the tables
DELETE FROM habit_completions;
DELETE FROM habits;
DELETE FROM vacation_schedules;

-- Add unique constraint for habit names per user
ALTER TABLE habits ADD CONSTRAINT unique_habit_name_per_user UNIQUE (user_id, name);