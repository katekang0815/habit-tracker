import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, addDays, format, isBefore } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface DayCompletion {
  date: Date;
  completionPercentage: number;
  totalHabits: number;
  completedHabits: number;
  hasHabits: boolean;
  oldestHabitDate?: Date;
}

export const useWeeklyCompletions = (user: User | null, currentDate: Date) => {
  const [weeklyCompletions, setWeeklyCompletions] = useState<DayCompletion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWeeklyCompletions([]);
      return;
    }

    const fetchWeeklyCompletions = async () => {
      setLoading(true);
      try {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        // Get all active habits for the user
        const { data: habits, error: habitsError } = await supabase
          .from("habits")
          .select("id, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (habitsError) throw habitsError;

        // Find the oldest habit creation date
        const oldestHabitDate = habits?.length 
          ? new Date(Math.min(...habits.map(h => new Date(h.created_at).getTime())))
          : null;

        // Get completions for the week
        const weekEndDate = addDays(weekStart, 6);
        const { data: completions, error: completionsError } = await supabase
          .from("habit_completions")
          .select("habit_id, completion_date")
          .eq("user_id", user.id)
          .gte("completion_date", format(weekStart, "yyyy-MM-dd"))
          .lte("completion_date", format(weekEndDate, "yyyy-MM-dd"));

        if (completionsError) throw completionsError;

        // Calculate completion data for each day
        const dayCompletions: DayCompletion[] = weekDays.map(date => {
          const dateStr = format(date, "yyyy-MM-dd");
          
          // Get habits that existed on this date
          const habitsForDate = habits?.filter(habit => 
            !isBefore(date, new Date(habit.created_at))
          ) || [];

          const completionsForDate = completions?.filter(c => 
            c.completion_date === dateStr
          ) || [];

          const totalHabits = habitsForDate.length;
          const completedHabits = completionsForDate.length;
          const completionPercentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

          return {
            date,
            completionPercentage,
            totalHabits,
            completedHabits,
            hasHabits: totalHabits > 0,
            oldestHabitDate
          };
        });

        setWeeklyCompletions(dayCompletions);
      } catch (error) {
        console.error("Error fetching weekly completions:", error);
        setWeeklyCompletions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyCompletions();
  }, [user, currentDate]);

  return { weeklyCompletions, loading };
};