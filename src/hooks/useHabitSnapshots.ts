import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPacificDateString, isPacificToday } from '@/lib/pacific-time';
import type { User } from '@supabase/supabase-js';

export interface HabitSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  habits_data: any[];
  created_at: string;
}

export interface SnapshotHabit {
  habit_id: string;
  habit_name: string;
  completed: boolean;
  completion_date: string;
  is_active: boolean;
}

export const useHabitSnapshots = (user: User | null, selectedDate: Date) => {
  const [snapshots, setSnapshots] = useState<HabitSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isToday = (date: Date): boolean => {
    return isPacificToday(date);
  };

  const fetchSnapshot = async (date: Date) => {
    if (!user || isToday(date)) return [];

    setLoading(true);
    try {
      const dateStr = formatPacificDateString(date);
      
      const { data, error } = await supabase
        .from('habit_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('snapshot_date', dateStr)
        .maybeSingle();

      if (error) {
        console.error('Error fetching snapshot:', error);
        toast({
          title: "Error",
          description: "Failed to fetch habit snapshot",
          variant: "destructive",
        });
        return [];
      }

      if (!data) {
        return [];
      }

      return (data.habits_data as unknown) as SnapshotHabit[];
    } catch (error) {
      console.error('Error fetching snapshot:', error);
      toast({
        title: "Error",
        description: "Failed to fetch habit snapshot",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-habits', {
        body: { action: 'migrate' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Historical habits migrated to snapshots successfully",
      });

      return data;
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Error",
        description: "Failed to run migration",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    snapshots,
    loading,
    fetchSnapshot,
    runMigration,
    isToday,
  };
};