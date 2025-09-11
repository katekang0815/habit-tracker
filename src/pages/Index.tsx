import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { WeekView } from "@/components/WeekView";
import { HabitList } from "@/components/HabitList";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useHabits } from "@/hooks/useHabits";
import { useVacationSchedules } from "@/hooks/useVacationSchedules";
import { isPacificToday } from "@/lib/pacific-time";
import { debounce } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const { habits, loading, addHabit, toggleHabit, deleteHabit, pauseHabit, activateHabit } = useHabits(user, currentDate);
  const { isDateInVacation } = useVacationSchedules();

  // Debounced date change to prevent rapid requests
  const debouncedDateChange = useMemo(
    () => debounce((date: Date) => setCurrentDate(date), 300),
    []
  );

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Sign-in Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign-out Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Sign-out Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const completedToday = habits.filter(habit => habit.completed).length;
  const streakCount = 7; // Mock streak counter

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{format(currentDate, "MMM yyyy")}</h1>
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-streak-flame" />
            <span className="text-sm font-semibold text-foreground">{streakCount}</span>
          </div>
        </div>
        
        <WeekView currentDate={currentDate} onDateChange={debouncedDateChange} />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-12 h-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Start Building Habits</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first habit and begin your journey to a better you. Tap the + button to get started!
            </p>
            {!user && (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="bg-primary/20"
                  onClick={handleGoogleSignIn}
                >
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>
        ) : (
          <HabitList 
            key={currentDate.toISOString()}
            habits={habits} 
            onToggleHabit={toggleHabit}
            onDeleteHabit={deleteHabit}
            onPauseHabit={pauseHabit}
            onActivateHabit={activateHabit}
            isVacationDate={isDateInVacation(currentDate)}
            isHistoricalDate={!isPacificToday(currentDate)}
          />
        )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          onAddClick={() => setIsAddDialogOpen(true)} 
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Add Habit Dialog */}
        <AddHabitDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddHabit={addHabit}
          existingHabits={habits}
        />
      </div>
    </div>
  );
};

export default Index;
