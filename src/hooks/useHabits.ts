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
  completion_date: string;
  completed: boolean;
}

export const useHabits = (user: User | null, selectedDate: Date) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isDateInVacation } = useVacationSchedules();

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    return date > today;
  };

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      return;
    }

    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate);
      
      // Fetch habits that were created on or before the selected date
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('created_at', `${dateStr}T23:59:59.999Z`)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      if (!habitsData || habitsData.length === 0) {
        setHabits([]);
        return;
      }

      // Fetch completions for the selected date
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', dateStr);

      if (completionsError) throw completionsError;

      // Merge habits with their completion status
      const completionsMap = new Map(
        completionsData?.map(c => [c.habit_id, c.completed]) || []
      );

      const habitsWithStatus = habitsData.map(habit => ({
        ...habit,
        completed: completionsMap.get(habit.id) || false,
        can_toggle: isToday(selectedDate) && !isFutureDate(selectedDate) && !isDateInVacation(selectedDate)
      }));

      setHabits(habitsWithStatus);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (name: string, emoji?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{
          user_id: user.id,
          name,
          emoji
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit added successfully"
      });

      fetchHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive"
      });
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user || !isToday(selectedDate) || isDateInVacation(selectedDate)) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const dateStr = formatDate(selectedDate);
    const newCompletedStatus = !habit.completed;

    try {
      const { data: existingCompletion } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('completion_date', dateStr)
        .single();

      if (existingCompletion) {
        // Update existing completion
        const { error } = await supabase
          .from('habit_completions')
          .update({ completed: newCompletedStatus })
          .eq('id', existingCompletion.id);

        if (error) throw error;
      } else {
        // Create new completion
        const { error } = await supabase
          .from('habit_completions')
          .insert([{
            habit_id: habitId,
            user_id: user.id,
            completion_date: dateStr,
            completed: newCompletedStatus
          }]);

        if (error) throw error;
      }

      // Update local state
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, completed: newCompletedStatus } : h
      ));

    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive"
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit deleted successfully"
      });

      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive"
      });
    }
  };

  const pauseHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit paused successfully"
      });

      fetchHabits();
    } catch (error) {
      console.error('Error pausing habit:', error);
      toast({
        title: "Error",
        description: "Failed to pause habit",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user, selectedDate]);

  // Function to get the earliest habit creation date
  const getEarliestHabitDate = async (): Promise<Date | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0 ? new Date(data[0].created_at) : null;
    } catch (error) {
      console.error('Error fetching earliest habit date:', error);
      return null;
    }
  };

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
    pauseHabit,
    refetch: fetchHabits,
    getEarliestHabitDate
  };
};