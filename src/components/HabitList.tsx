import { Habit } from "@/pages/Index";
import { Check } from "lucide-react";

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
}

const HabitList = ({ habits, onToggleHabit }: HabitListProps) => {
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
            
            <button
              onClick={() => onToggleHabit(habit.id)}
              className="w-8 h-8 rounded-full border-2 border-border/50 bg-background/50 hover:bg-card transition-all duration-300 flex items-center justify-center"
            >
              {habit.completed && (
                <Check className="w-4 h-4 text-habit-complete" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export { HabitList };