import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useVacationSchedules } from "@/hooks/useVacationSchedules";
import type { User } from "@supabase/supabase-js";

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  is_active: boolean;
  completed?: boolean;
  can_toggle?: boolean;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completion_date: string; // DATE, e.g. "2025-08-27"
  completed: boolean;
}

export const useHabits = (user: User | null, selectedDate: Date) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isDateInVacation } = useVacationSchedules();

  // ---------- Local-time helpers ----------
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // "YYYY-MM-DD" in user's LOCAL timezone (no UTC conversion)
  const formatDateLocal = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOfNextLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

  const isFutureLocalDate = (d: Date) =>
    startOfLocalDay(d) > startOfLocalDay(new Date());

  // ----------------------------------------

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      return;
    }

    setLoading(true);
    try {
      const dateStr = formatDateLocal(selectedDate); // for DATE comparisons
      const nextLocalMidnightISO = startOfNextLocalDay(selectedDate).toISOString(); // for timestamptz

      // Habits created on/before the selected LOCAL day (include both active and paused)
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .lt("created_at", nextLocalMidnightISO) // strictly before next day's local midnight
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;

      if (!habitsData || habitsData.length === 0) {
        setHabits([]);
        return;
      }

      // Completions for the selected LOCAL day
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("completion_date", dateStr);

      if (completionsError) throw completionsError;

      const completionsMap = new Map(
        (completionsData ?? []).map((c: HabitCompletion) => [c.habit_id, c.completed])
      );

      const habitsWithStatus = habitsData.map((habit: Habit) => ({
        ...habit,
        completed: completionsMap.get(habit.id) || false,
        can_toggle: !isFutureLocalDate(selectedDate) && !isDateInVacation(selectedDate),
      }));

      setHabits(habitsWithStatus);
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (name: string, emoji?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("habits")
        .insert([{ user_id: user.id, name, emoji }]);

      if (error) throw error;

      toast({ title: "Success", description: "Habit added successfully" });
      fetchHabits();
    } catch (error: any) {
      console.error("Error adding habit:", error);
      
      // Check if it's a duplicate habit error
      const isDuplicateError = error?.code === '23505' || 
                              error?.message?.includes('duplicate') ||
                              error?.message?.includes('unique constraint');
      
      toast({
        title: "Error",
        description: isDuplicateError 
          ? "You already added this habit" 
          : "Failed to add habit",
        variant: "destructive",
      });
    }
  };

  const toggleHabit = async (habitId: string) => {
    // Block future or vacation dates using LOCAL-day logic
    if (!user || isFutureLocalDate(selectedDate) || isDateInVacation(selectedDate)) {
      console.log("Toggle blocked - Future date or vacation:", {
        future: isFutureLocalDate(selectedDate),
        vacation: isDateInVacation(selectedDate),
      });
      return;
    }

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      console.log("Habit not found:", habitId);
      return;
    }

    const dateStr = formatDateLocal(selectedDate);
    const newCompletedStatus = !habit.completed;

    // Optimistic UI
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, completed: newCompletedStatus } : h))
    );

    try {
      // Requires a unique index/constraint on (user_id, habit_id, completion_date)
      const { error } = await supabase
        .from("habit_completions")
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            completion_date: dateStr, // local calendar day
            completed: newCompletedStatus,
          },
          { onConflict: "user_id,habit_id,completion_date" }
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling habit:", error);
      // Revert optimistic UI on error
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, completed: habit.completed } : h))
      );
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      // First delete all habit completions for this habit
      const { error: completionsError } = await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habitId)
        .eq("user_id", user.id);

      if (completionsError) throw completionsError;

      // Then delete the habit itself
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Success", description: "Habit deleted successfully" });
      fetchHabits();
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive",
      });
    }
  };

  const pauseHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", habitId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Success", description: "Habit paused successfully" });
      fetchHabits();
    } catch (error) {
      console.error("Error pausing habit:", error);
      toast({
        title: "Error",
        description: "Failed to pause habit",
        variant: "destructive",
      });
    }
  };

  const activateHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("habits")
        .update({ is_active: true })
        .eq("id", habitId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Success", description: "Habit activated successfully" });
      fetchHabits();
    } catch (error) {
      console.error("Error activating habit:", error);
      toast({
        title: "Error",
        description: "Failed to activate habit",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user, selectedDate]);

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
    pauseHabit,
    activateHabit,
    refetch: fetchHabits,
  };
};
