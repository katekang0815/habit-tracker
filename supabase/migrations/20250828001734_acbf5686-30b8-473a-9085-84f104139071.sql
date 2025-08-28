-- Create unique index to prevent duplicate habit completions for same user, habit, and date
CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_unique_user_habit_day
ON habit_completions (user_id, habit_id, completion_date);