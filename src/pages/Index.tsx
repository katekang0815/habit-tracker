import { useState } from "react";
import { Calendar, Flame, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { WeekView } from "@/components/WeekView";
import { HabitList } from "@/components/HabitList";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  emoji?: string;
  paused?: boolean;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const addHabit = (name: string, emoji?: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completed: false,
      emoji
    };
    setHabits([...habits, newHabit]);
  };

  const toggleHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    ));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  const pauseHabit = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, paused: !habit.paused, completed: false } : habit
    ));
  };

  const completedToday = habits.filter(habit => habit.completed).length;
  const streakCount = 7; // Mock streak counter

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Welcome to Habit Tracker</h1>
            <p className="text-muted-foreground">
              Build better habits and track your progress. Sign in to get started on your journey to success.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link to="/auth">
              <Button size="lg" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              Track habits • Build streaks • Achieve goals
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {format(new Date(), "EEEE, MMM d")}
              </h1>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg">
            <Flame className="w-4 h-4 text-streak-flame" />
            <span className="text-sm font-medium text-foreground">
              {streakCount} day streak
            </span>
          </div>
        </div>
      </header>

      <div className="px-6 py-4">
        <WeekView />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Start Building Habits</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first habit and begin your journey to a better you. Tap the + button to get started!
            </p>
          </div>
        ) : (
          <HabitList 
            habits={habits} 
            onToggleHabit={toggleHabit}
            onDeleteHabit={deleteHabit}
            onPauseHabit={pauseHabit}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation onAddClick={() => setIsAddDialogOpen(true)} />

      {/* Add Habit Dialog */}
      <AddHabitDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddHabit={addHabit}
        existingHabits={habits}
      />
    </div>
  );
};

export default Index;