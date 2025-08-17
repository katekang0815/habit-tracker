import { useState } from "react";
import { WeekView } from "@/components/WeekView";
import { HabitList } from "@/components/HabitList";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  emoji?: string;
  paused?: boolean;
}

const Index = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Aug 2025</h1>
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-streak-flame" />
            <span className="text-sm font-semibold text-foreground">{streakCount}</span>
          </div>
        </div>
        
        <WeekView />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-24">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Start Building Habits</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first habit and begin your journey to a better you. Tap the + button to get started!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="border-cyan-400">
                Login
              </Button>
              <Button variant="outline"className="border-cyan-400">
                Sign Up
              </Button>
            </div>
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