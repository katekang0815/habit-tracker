import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeekViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  earliestHabitDate?: Date;
}

const WeekView = ({ currentDate, onDateChange, earliestHabitDate }: WeekViewProps) => {
  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isBeforeHabits = earliestHabitDate && date < earliestHabitDate;
    return {
      name: format(date, "EEE"),
      date: parseInt(format(date, "d")),
      fullDate: date,
      isToday: isSameDay(date, today),
      isFuture: date > today,
      isPast: date < today,
      isBeforeHabits,
    };
  });

  const goToPreviousWeek = () => {
    const previousWeek = subWeeks(currentDate, 1);
    onDateChange(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentDate, 1);
    onDateChange(nextWeek);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex justify-between items-center gap-2 flex-1 mx-4">
          {days.map((day) => (
            <div key={day.fullDate.toISOString()} className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-2 font-medium">
                {day.name}
              </span>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 cursor-pointer ${
                  day.isBeforeHabits || day.isFuture
                    ? "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    : day.isToday
                    ? "bg-amber-400 text-white shadow-lg scale-105"
                    : "bg-primary text-primary-foreground hover:bg-primary-glow hover:scale-105"
                }`}
                onClick={() => onDateChange(day.fullDate)}
              >
                {day.date}
              </div>
              <div className={`w-1 h-1 rounded-full mt-2 ${
                day.isBeforeHabits || day.isFuture 
                  ? "bg-gray-300" 
                  : day.isToday 
                  ? "bg-amber-800" 
                  : "bg-primary"
              }`} />
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { WeekView };