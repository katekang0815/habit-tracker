import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import type { User } from "@supabase/supabase-js";

export interface HabitStatistic {
  habitId: string;
  habitName: string;
  emoji?: string;
  completedDays: Set<number>;
  completedCount: number;
  completionPercentage: number;
}

export const useHabitStatistics = (user: User | null, currentDate: Date) => {
  const [habitStats, setHabitStats] = useState<HabitStatistic[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHabitStatistics = async () => {
    if (!user) {
      setHabitStats([]);
      return;
    }

    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const daysInMonth = getDaysInMonth(currentDate);

      // Fetch habits that were created before or during the selected month
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, emoji, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('created_at', format(monthEnd, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      if (!habitsData || habitsData.length === 0) {
        setHabitStats([]);
        return;
      }

      // Fetch completions for the month
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completion_date, completed')
        .eq('user_id', user.id)
        .gte('completion_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('completion_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('completed', true);

      if (completionsError) throw completionsError;

      // Group completions by habit
      const completionsByHabit = new Map<string, Set<number>>();
      completionsData?.forEach((completion) => {
        const day = parseInt(completion.completion_date.split('-')[2]);
        if (!completionsByHabit.has(completion.habit_id)) {
          completionsByHabit.set(completion.habit_id, new Set());
        }
        completionsByHabit.get(completion.habit_id)?.add(day);
      });

      // Calculate statistics for each habit
      const statistics: HabitStatistic[] = habitsData.map((habit) => {
        const completedDays = completionsByHabit.get(habit.id) || new Set();
        const completedCount = completedDays.size;
        
        // Calculate how many days this habit was "active" during the month
        const habitCreatedDate = new Date(habit.created_at);
        const effectiveStartDate = habitCreatedDate > monthStart ? habitCreatedDate : monthStart;
        const daysSinceCreated = Math.ceil((monthEnd.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const activeDays = Math.min(daysSinceCreated, daysInMonth);
        
        const completionPercentage = activeDays > 0 ? Math.round((completedCount / activeDays) * 100) : 0;

        return {
          habitId: habit.id,
          habitName: habit.name,
          emoji: habit.emoji,
          completedDays,
          completedCount,
          completionPercentage
        };
      });

      setHabitStats(statistics);
    } catch (error) {
      console.error('Error fetching habit statistics:', error);
      setHabitStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitStatistics();
  }, [user, currentDate]);

  return {
    habitStats,
    loading,
    refetch: fetchHabitStatistics
  };
};