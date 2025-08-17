import { useState } from "react";
import { Habit } from "@/pages/Index";
import { Check, StarHalf } from "lucide-react";

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
}

const HabitList = ({ habits, onToggleHabit }: HabitListProps) => {
  const [animatingHabits, setAnimatingHabits] = useState<Set<string>>(new Set());

  const handleToggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    
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
          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
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
            
            <div className="relative">
              <button
                onClick={() => handleToggleHabit(habit.id)}
                className="w-8 h-8 rounded-full border-2 border-border/50 bg-background/50 hover:bg-card transition-all duration-300 flex items-center justify-center relative"
              >
                {habit.completed && (
                  <Check className={`w-4 h-4 text-habit-complete ${animatingHabits.has(habit.id) ? 'animate-spark' : ''}`} />
                )}
              </button>
              
              {/* Burst lines animation */}
              {animatingHabits.has(habit.id) && (
                <>
                  {/* Radiating lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-habit-complete transform -translate-x-1/2 -translate-y-4 animate-burst-line" style={{ animationDelay: '0ms' }} />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-4 h-0.5 bg-habit-complete transform rotate-45 origin-left translate-x-2 -translate-y-2 animate-burst-line" style={{ animationDelay: '100ms' }} />
                    {/* Right */}
                    <div className="absolute top-1/2 right-0 w-6 h-0.5 bg-habit-complete transform -translate-y-1/2 translate-x-4 animate-burst-line" style={{ animationDelay: '200ms' }} />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-4 h-0.5 bg-habit-complete transform -rotate-45 origin-left translate-x-2 translate-y-2 animate-burst-line" style={{ animationDelay: '300ms' }} />
                    {/* Bottom */}
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-habit-complete transform -translate-x-1/2 translate-y-4 animate-burst-line" style={{ animationDelay: '400ms' }} />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-4 h-0.5 bg-habit-complete transform rotate-45 origin-right -translate-x-2 translate-y-2 animate-burst-line" style={{ animationDelay: '500ms' }} />
                    {/* Left */}
                    <div className="absolute top-1/2 left-0 w-6 h-0.5 bg-habit-complete transform -translate-y-1/2 -translate-x-4 animate-burst-line" style={{ animationDelay: '600ms' }} />
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-4 h-0.5 bg-habit-complete transform -rotate-45 origin-right -translate-x-2 -translate-y-2 animate-burst-line" style={{ animationDelay: '700ms' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { HabitList };