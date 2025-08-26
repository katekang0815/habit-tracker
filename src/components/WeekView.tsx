import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isAfter, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayCompletion {
  date: Date;
  completionPercentage: number;
  totalHabits: number;
  completedHabits: number;
  hasHabits: boolean;
  oldestHabitDate?: Date;
}

interface WeekViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  weeklyCompletions?: DayCompletion[];
}

const WeekView = ({ currentDate, onDateChange, weeklyCompletions = [] }: WeekViewProps) => {
  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const completion = weeklyCompletions.find(c => isSameDay(c.date, date));
    
    return {
      name: format(date, "EEE"),
      date: parseInt(format(date, "d")),
      fullDate: date,
      isToday: isSameDay(date, today),
      isFuture: isAfter(date, today),
      isBeforeHabits: completion?.oldestHabitDate ? isBefore(date, completion.oldestHabitDate) : false,
      completionPercentage: completion?.completionPercentage || 0,
      hasHabits: completion?.hasHabits || false,
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
          {days.map((day) => {
            const getDayStyle = () => {
              if (day.isFuture || day.isBeforeHabits) {
                return "bg-muted text-muted-foreground cursor-not-allowed";
              }
              
              if (day.isToday) {
                return "relative bg-amber-500 text-white shadow-lg scale-105";
              }
              
              if (!day.hasHabits) {
                return "bg-muted text-muted-foreground";
              }
              
              if (day.completionPercentage >= 60) {
                return "bg-green-500 text-white hover:bg-green-600 hover:scale-105";
              } else {
                return "bg-red-500 text-white hover:bg-red-600 hover:scale-105";
              }
            };

            const getIndicatorStyle = () => {
              if (day.isFuture || day.isBeforeHabits) {
                return "bg-muted";
              }
              if (day.isToday) {
                return "bg-amber-500";
              }
              if (!day.hasHabits) {
                return "bg-muted";
              }
              if (day.completionPercentage >= 60) {
                return "bg-green-500";
              } else {
                return "bg-red-500";
              }
            };

            return (
              <div key={day.fullDate.toISOString()} className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-2 font-medium">
                  {day.name}
                </span>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 cursor-pointer relative ${getDayStyle()}`}
                  onClick={() => !day.isFuture && !day.isBeforeHabits && onDateChange(day.fullDate)}
                >
                  {day.isToday && day.hasHabits && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#10b981 0deg ${day.completionPercentage * 3.6}deg, transparent ${day.completionPercentage * 3.6}deg 360deg)`
                      }}
                    />
                  )}
                  <span className="relative z-10">{day.date}</span>
                </div>
                <div className={`w-1 h-1 rounded-full mt-2 ${getIndicatorStyle()}`} />
              </div>
            );
          })}
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