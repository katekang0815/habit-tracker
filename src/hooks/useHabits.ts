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
  completion_date: string; // DATE in DB, e.g. "2025-08-27"
  completed: boolean;
}

export const useHabits = (user: User | null, selectedDate: Date) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isDateInVacation } = useVacationSchedules();

  // ---- Local-time helpers (no UTC conversions) ----
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // "YYYY-MM-DD" in the user's LOCAL timezone
  const formatDateLocal = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const startOfLocalDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const startOfNextLocalDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

  const isTodayLocal = (d: Date) =>
    formatDateLocal(d) === formatDateLocal(new Date());

  const isFutureLocalDate = (d: Date) =>
    startOfLocalDay(d) > startOfLocalDay(new Date());

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      return;
    }

    setLoading(true);
    try {
      // Local date string for DATE columns (e.g., completion_date)
      const dateStr = formatDateLocal(selectedDate);

      // Use "strictly less than next day's local midnight"
      // Convert that local midnight to UTC string for the timestamptz comparison.
      const nextLocalMidnightISO = startOfNextLocalDay(selectedDate).toISOString();

      // Fetch habits created on/before the selected LOCAL day
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lt("created_at", nextLocalMidnightISO) // local-day boundary, robust to microseconds
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;

      if (!habitsData || habitsData.length === 0) {
        setHabits([]);
        return;
      }

      // Fetch completions for the LOCAL selected day (DATE column)
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("completion_date", dateStr);

      if (completionsError) throw completionsError;

      // Merge habits with completion status
      const completionsMap = new Map(
        (completionsData ?? []).map((c) => [c.habit_id, c.completed])
      );

      const habitsWithStatus = habitsData.map((habit) => ({
        ...habit,
        completed: completionsMap.get(habit.id) || false,
        can_toggle:
          !isFutureLocalDate(selectedDate) && !isDateInVacation(selectedDate),
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
      const { data, error } = await supabase
        .from("habits")
        .insert([
          {
            user_id: user.id,
            name,
            emoji,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit added successfully",
      });

      fetchHabits();
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    }
  };

  const toggleHabit = async (habitId: string) => {
    // Block future or vacation days using LOCAL-day logic
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
      const { data: existingCompletion } = await supabase
        .from("habit_completions")
        .select("id")
        .eq("habit_id", habitId)
        .eq("completion_date", dateStr)
        .eq("user_id", user.id)
        .single();

      if (existingCompletion) {
        const { error } = await supabase
          .from("habit_completions")
          .update({ completed: newCompletedStatus })
          .eq("id", existingCompletion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_completions").insert([
          {
            habit_id: habitId,
            user_id: user.id,
            completion_date: dateStr, // local day string
            completed: newCompletedStatus,
          },
        ]);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
      // Revert on error
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
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
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
    refetch: fetchHabits,
  };
};
