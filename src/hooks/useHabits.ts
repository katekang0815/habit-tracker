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
  console.log('DATE: ', selectedDate)  
  
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
        can_toggle: !isFutureDate(selectedDate) && !isDateInVacation(selectedDate)
      }));

      console.log('Fetched habits with status:', habitsWithStatus);
      console.log('Selected date:', dateStr, 'Is future:', isFutureDate(selectedDate), 'Is vacation:', isDateInVacation(selectedDate));

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
    if (!user || isFutureDate(selectedDate) || isDateInVacation(selectedDate)) {
      console.log('Toggle blocked - Future date or vacation:', { 
        future: isFutureDate(selectedDate), 
        vacation: isDateInVacation(selectedDate) 
      });
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      console.log('Habit not found:', habitId);
      return;
    }

    const dateStr = formatDate(selectedDate);
    const newCompletedStatus = !habit.completed;

    console.log('Toggling habit:', {
      habitId,
      habitName: habit.name,
      currentStatus: habit.completed,
      newStatus: newCompletedStatus,
      date: dateStr
    });

    // Update local state immediately for better UX
    setHabits(prev => {
      const updated = prev.map(h => 
        h.id === habitId ? { ...h, completed: newCompletedStatus } : h
      );
      console.log('Updated local state:', updated.find(h => h.id === habitId));
      return updated;
    });

    try {
      const { data: existingCompletion } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('completion_date', dateStr)
        .eq('user_id', user.id)
        .single();

      if (existingCompletion) {
        console.log('Updating existing completion:', existingCompletion.id);
        // Update existing completion
        const { error } = await supabase
          .from('habit_completions')
          .update({ completed: newCompletedStatus })
          .eq('id', existingCompletion.id);

        if (error) throw error;
      } else {
        console.log('Creating new completion');
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

      console.log('Database updated successfully');

    } catch (error) {
      console.error('Error toggling habit:', error);
      
      // Revert local state on error
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, completed: habit.completed } : h
      ));
      
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

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    deleteHabit,
    pauseHabit,
    refetch: fetchHabits
  };
};
