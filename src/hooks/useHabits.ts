import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useVacationSchedules } from "@/hooks/useVacationSchedules";
import { useHabitSnapshots, type SnapshotHabit } from "@/hooks/useHabitSnapshots";
import { formatPacificDateString, isPacificToday, isPacificFutureDate, getNextPacificDayStart } from "@/lib/pacific-time";
import type { User } from "@supabase/supabase-js";

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  is_active: boolean;
  completed?: boolean;
  can_toggle?: boolean;
  order_index?: number;
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
  const { fetchSnapshot, runMigration } = useHabitSnapshots(user, selectedDate);
  
  // Request management
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestVersionRef = useRef(0);
  const lastRequestedDateRef = useRef<string>("");

  // ----------------------------------------

  const fetchHabits = async () => {
    console.log("fetchHabits called for date:", selectedDate.toDateString(), "user:", user?.id);
    
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Increment request version
    const currentRequestVersion = ++requestVersionRef.current;
    
    // Check for duplicate requests
    const dateKey = selectedDate.toISOString();
    if (lastRequestedDateRef.current === dateKey) {
      console.log("Skipping duplicate request for date:", dateKey);
      return;
    }
    lastRequestedDateRef.current = dateKey;

    console.log("Starting fetch for date:", selectedDate.toDateString(), "isToday:", isPacificToday(selectedDate));
    setLoading(true);
    
    try {
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // For historical dates (not today), fetch from snapshots
      if (!isPacificToday(selectedDate)) {
        const snapshotHabits = await fetchSnapshot(selectedDate);
        
        // Check if this is still the current request
        if (currentRequestVersion !== requestVersionRef.current || abortController.signal.aborted) {
          return;
        }
        
        if (snapshotHabits && snapshotHabits.length > 0) {
          const habitsWithStatus = snapshotHabits.map((snapshot: SnapshotHabit) => ({
            id: snapshot.habit_id,
            name: snapshot.habit_name,
            emoji: '', // Not stored in snapshots
            is_active: snapshot.is_active,
            completed: snapshot.completed,
            can_toggle: false, // Historical data is read-only
          }));
          
          setHabits(habitsWithStatus);
          setLoading(false);
          return;
        }
      }

      // For today or when no snapshot exists, use dynamic data
      const dateStr = formatPacificDateString(selectedDate); // for DATE comparisons
      const nextPacificDayISO = getNextPacificDayStart(selectedDate).toISOString(); // for timestamptz

      // Check if request was aborted before making API calls
      if (abortController.signal.aborted) {
        return;
      }

      // Habits created on/before the selected LOCAL day (include both active and paused)
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .lt("created_at", nextPacificDayISO) // strictly before next day's Pacific midnight
        .order("order_index", { ascending: true });

      if (habitsError) throw habitsError;

      // Check if this is still the current request
      if (currentRequestVersion !== requestVersionRef.current || abortController.signal.aborted) {
        return;
      }

      if (!habitsData || habitsData.length === 0) {
        console.log("No habits found for user");
        setHabits([]);
        setLoading(false);
        return;
      }

      // Completions for the selected LOCAL day
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("completion_date", dateStr);

      if (completionsError) throw completionsError;

      // Final check if this is still the current request
      if (currentRequestVersion !== requestVersionRef.current || abortController.signal.aborted) {
        return;
      }

      const completionsMap = new Map(
        (completionsData ?? []).map((c: HabitCompletion) => [c.habit_id, c.completed])
      );

      const habitsWithStatus = habitsData.map((habit: Habit) => ({
        ...habit,
        completed: completionsMap.get(habit.id) || false,
        can_toggle: !isPacificFutureDate(selectedDate) && !isDateInVacation(selectedDate),
      }));

      setHabits(habitsWithStatus);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError') {
        console.log("Request aborted");
        return;
      }
      
      console.error("Error fetching habits:", error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if this is the current request
      if (currentRequestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  };

  const addHabit = async (name: string, emoji?: string) => {
    if (!user) return;

    try {
      // Get the next order_index for this user
      const { data: maxOrderData } = await supabase
        .from("habits")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData?.[0]?.order_index || 0) + 1;

      const { error } = await supabase
        .from("habits")
        .insert([{ user_id: user.id, name, emoji, order_index: nextOrder }]);

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
    // Block future or vacation dates using Pacific timezone logic
    if (!user || isPacificFutureDate(selectedDate) || isDateInVacation(selectedDate)) {
      console.log("Toggle blocked - Future date or vacation:", {
        future: isPacificFutureDate(selectedDate),
        vacation: isDateInVacation(selectedDate),
      });
      return;
    }

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      console.log("Habit not found:", habitId);
      return;
    }

    const dateStr = formatPacificDateString(selectedDate);
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
            completion_date: dateStr, // Pacific timezone calendar day
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
    // Clear the last requested date when selectedDate changes
    // This ensures we don't skip the request for the new date
    lastRequestedDateRef.current = "";
    
    // Don't clear habits immediately to prevent flash of empty content
    // The loading state will handle the UI feedback
    fetchHabits();
    
    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, selectedDate]);

  const reorderHabits = async (habitIds: string[]) => {
    if (!user) return;

    try {
      // Create batch updates for all habits with new order indices
      const updates = habitIds.map((habitId, index) => ({
        id: habitId,
        user_id: user.id,
        order_index: index + 1
      }));

      // Optimistically update UI
      const newHabits = [...habits].sort((a, b) => {
        const aIndex = habitIds.indexOf(a.id);
        const bIndex = habitIds.indexOf(b.id);
        return aIndex - bIndex;
      });
      setHabits(newHabits);

      // Update database
      for (const update of updates) {
        const { error } = await supabase
          .from("habits")
          .update({ order_index: update.order_index })
          .eq("id", update.id)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error reordering habits:", error);
      // Revert on error
      fetchHabits();
      toast({
        title: "Error",
        description: "Failed to reorder habits",
        variant: "destructive",
      });
    }
  };

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
    pauseHabit,
    activateHabit,
    reorderHabits,
    refetch: fetchHabits,
    runMigration, // Expose migration function
  };
};
