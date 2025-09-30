import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { formatPacificDateString, toPacificDate, isPacificToday } from "@/lib/pacific-time";
import type { User } from "@supabase/supabase-js";

export interface HabitStatistic {
  habitId: string;
  habitName: string;
  emoji?: string;
  completedDays: Set<number>;
  completedCount: number;
  completionPercentage: number;
}

export const useHabitStatistics = (user: User | null, currentDate: Date, targetUserId?: string) => {
  const [habitStats, setHabitStats] = useState<HabitStatistic[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHabitStatistics = async () => {
    if (!user) {
      setHabitStats([]);
      return;
    }

    setLoading(true);
    try {
      // Convert to Pacific timezone for consistent date handling
      const pacificDate = toPacificDate(currentDate);
      const monthStart = startOfMonth(pacificDate);
      const monthEnd = endOfMonth(pacificDate);
      const daysInMonth = getDaysInMonth(pacificDate);

      // Check if the selected month is the current month
      const today = new Date();
      const currentPacificDate = toPacificDate(today);
      const isCurrentMonth = pacificDate.getFullYear() === currentPacificDate.getFullYear() && 
                           pacificDate.getMonth() === currentPacificDate.getMonth();

      // Use targetUserId if provided, otherwise use current user's id
      const userId = targetUserId || user.id;
      
      // Calculate end of month in Pacific timezone properly
      // Create end of month date at 23:59:59 Pacific time, then convert to UTC for database comparison
      const monthEndPacificTime = new Date(monthEnd.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      monthEndPacificTime.setHours(23, 59, 59, 999);
      
      // Convert back to UTC by getting the offset and adjusting
      const pacificOffset = monthEndPacificTime.getTimezoneOffset();
      const monthEndPacific = new Date(monthEndPacificTime.getTime() - (pacificOffset * 60000));
      
      // Fetch habits that were created before or during the selected month
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, emoji, created_at')
        .eq('user_id', userId)
        .lte('created_at', monthEndPacific.toISOString())
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      if (!habitsData || habitsData.length === 0) {
        setHabitStats([]);
        return;
      }

      // Initialize completion map
      const completionsByHabit = new Map<string, Set<number>>();

      // Only fetch current month's habit_completions if viewing current month
      let currentMonthCompletions: any[] = [];
      if (isCurrentMonth) {
        const { data: monthCompletions, error: monthError } = await supabase
          .from('habit_completions')
          .select('habit_id, completion_date, completed')
          .eq('user_id', userId)
          .gte('completion_date', formatPacificDateString(monthStart))
          .lte('completion_date', formatPacificDateString(monthEnd))
          .eq('completed', true);

        if (monthError) throw monthError;
        currentMonthCompletions = monthCompletions || [];
      }

      // Query habit_snapshots for the selected month
      const snapshotEndDate = isCurrentMonth ? formatPacificDateString(currentPacificDate) : formatPacificDateString(monthEnd);
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('habit_snapshots')
        .select('snapshot_date, habits_data')
        .eq('user_id', userId)
        .gte('snapshot_date', formatPacificDateString(monthStart))
        .lt('snapshot_date', snapshotEndDate)
        .lte('snapshot_date', formatPacificDateString(monthEnd));

      if (snapshotsError) throw snapshotsError;

      // Process current month's completions (only for current month)
      currentMonthCompletions.forEach((completion) => {
        const day = parseInt(completion.completion_date.split('-')[2]);
        if (!completionsByHabit.has(completion.habit_id)) {
          completionsByHabit.set(completion.habit_id, new Set());
        }
        completionsByHabit.get(completion.habit_id)?.add(day);
      });

      // Process historical snapshots
      snapshotsData?.forEach((snapshot) => {
        const day = parseInt(snapshot.snapshot_date.split('-')[2]);
        const habitsArray = snapshot.habits_data as any[];
        
        habitsArray?.forEach((habitData) => {
          if (habitData.completed && habitData.habit_id) {
            if (!completionsByHabit.has(habitData.habit_id)) {
              completionsByHabit.set(habitData.habit_id, new Set());
            }
            completionsByHabit.get(habitData.habit_id)?.add(day);
          }
        });
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
  }, [user, currentDate, targetUserId]);

  return {
    habitStats,
    loading,
    refetch: fetchHabitStatistics
  };
};