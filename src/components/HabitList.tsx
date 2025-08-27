import { useState } from "react";
import { Check, StarHalf, Sparkles, MoreVertical, Trash2, Pause, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Habit {
  id: string;
  name: string;
  emoji?: string;
  is_active: boolean;
  completed?: boolean;
  can_toggle?: boolean;
}

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onPauseHabit: (id: string) => void;
}

const HabitList = ({ habits, onToggleHabit, onDeleteHabit, onPauseHabit }: HabitListProps) => {
  const [animatingHabits, setAnimatingHabits] = useState<Set<string>>(new Set());

  const handleToggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    
    // Don't allow toggling if habit can't be toggled (not today or future date)
    if (!habit?.can_toggle) return;
    
    // If habit is being marked as complete, trigger animation
    if (habit && !habit.completed) {
      setAnimatingHabits(prev => new Set(prev).add(id));
      
      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 800);
    }
    
    onToggleHabit(id);
  };

  return (
    <div className="space-y-3">
      {habits.map((habit, index) => (
        <div
          key={habit.id}
          className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
            !habit.can_toggle ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-muted-foreground">
              {index + 1}
            </span>
            
            <div className="flex items-center gap-3 flex-1">
              {habit.emoji && (
                <span className="text-xl">{habit.emoji}</span>
              )}
              <span className="font-medium transition-all duration-300 text-foreground">
                {habit.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => handleToggleHabit(habit.id)}
                  disabled={!habit.can_toggle}
                  className={`w-8 h-8 rounded-full border-2 border-border/50 bg-background/50 hover:bg-card transition-all duration-300 flex items-center justify-center relative ${
                    !habit.can_toggle ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {habit.completed && (
                    <Check className={`w-4 h-4 text-habit-complete ${animatingHabits.has(habit.id) ? 'animate-spark' : ''}`} />
                  )}
                </button>
                
                {/* Sparkles animation */}
                {animatingHabits.has(habit.id) && (
                  <>
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-habit-complete animate-sparkle" style={{ animationDelay: '0ms' }} />
                    <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-habit-complete animate-sparkle" style={{ animationDelay: '200ms' }} />
                    <Sparkles className="absolute top-0 -left-1 w-2 h-2 text-habit-complete animate-sparkle" style={{ animationDelay: '400ms' }} />
                  </>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full hover:bg-muted/50 transition-colors duration-200 flex items-center justify-center">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onPauseHabit(habit.id)}
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteHabit(habit.id)}
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { HabitList };