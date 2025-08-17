import { Habit } from "@/pages/Index";
import { Checkbox } from "@/components/ui/checkbox";

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
              <span className={`font-medium transition-all duration-300 ${
                habit.completed 
                  ? "text-habit-complete line-through" 
                  : "text-foreground"
              }`}>
                {habit.name}
              </span>
            </div>
            
            <Checkbox
              checked={habit.completed}
              onCheckedChange={() => onToggleHabit(habit.id)}
              className="data-[state=checked]:bg-habit-complete data-[state=checked]:border-habit-complete"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export { HabitList };