import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VacationSchedule {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface CreateVacationSchedule {
  start_date: string;
  end_date: string;
}

export const useVacationSchedules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vacationSchedules = useQuery({
    queryKey: ["vacation-schedules", user?.id],
    queryFn: async (): Promise<VacationSchedule[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("vacation_schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching vacation schedules:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  const addVacationSchedule = useMutation({
    mutationFn: async (schedule: CreateVacationSchedule) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("vacation_schedules")
        .insert({
          user_id: user.id,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating vacation schedule:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacation-schedules"] });
      toast({
        title: "Vacation scheduled!",
        description: "Your vacation period has been set successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding vacation schedule:", error);
      toast({
        title: "Error",
        description: "Failed to schedule vacation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVacationSchedule = useMutation({
    mutationFn: async ({ id, start_date, end_date }: { id: string; start_date: string; end_date: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("vacation_schedules")
        .update({
          start_date,
          end_date,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating vacation schedule:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacation-schedules"] });
      toast({
        title: "Vacation updated!",
        description: "Your vacation period has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating vacation schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update vacation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVacationSchedule = useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("vacation_schedules")
        .delete()
        .eq("id", scheduleId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting vacation schedule:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacation-schedules"] });
      toast({
        title: "Vacation cancelled",
        description: "Your vacation has been cancelled successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting vacation schedule:", error);
      toast({
        title: "Error",
        description: "Failed to cancel vacation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to check if a date is within any vacation period
  const isDateInVacation = (date: Date): boolean => {
    if (!vacationSchedules.data) return false;

    const dateString = date.toISOString().split('T')[0];
    
    return vacationSchedules.data.some(schedule => 
      dateString >= schedule.start_date && dateString <= schedule.end_date
    );
  };

  return {
    vacationSchedules: vacationSchedules.data || [],
    isVacationSchedulesLoading: vacationSchedules.isLoading,
    addVacationSchedule,
    updateVacationSchedule,
    deleteVacationSchedule,
    isDateInVacation,
  };
};