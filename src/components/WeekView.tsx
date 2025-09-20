import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WeekViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isToggled?: (date: Date) => boolean;
}

const WeekView = ({ currentDate, onDateChange, isToggled }: WeekViewProps) => {
  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  const weekEnd = addDays(weekStart, 6);
  
  // Track if we're in a navigated week (not the current week)
  const [isNavigatedWeek, setIsNavigatedWeek] = useState(false);
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      name: format(date, "EEE"),
      date: parseInt(format(date, "d")),
      fullDate: date,
      isToday: isSameDay(date, today),
    };
  });

  const goToPreviousWeek = () => {
    const previousWeekStart = subWeeks(currentDate, 1);
    const previousWeekSaturday = addDays(startOfWeek(previousWeekStart, { weekStartsOn: 0 }), 6);
    
    setIsNavigatedWeek(true);
    onDateChange(previousWeekSaturday);
  };

  const goToNextWeek = () => {
    const nextWeekSunday = startOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 0 });
    
    setIsNavigatedWeek(true);
    onDateChange(nextWeekSunday);
  };

  const handleDateClick = (date: Date) => {
    // When clicking a date, clear the navigated week state
    setIsNavigatedWeek(false);
    onDateChange(date);
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
                  day.isToday
                    ? "bg-calendar-today text-white shadow-lg scale-105"
                    : isSameDay(day.fullDate, currentDate)
                    ? "bg-amber-400 text-white shadow-lg scale-105"
                    : isNavigatedWeek && day.fullDate <= today
                    ? "bg-primary text-primary-foreground hover:bg-primary-glow hover:scale-105"
                    : day.fullDate > today
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary-glow hover:scale-105"
                }`}
                onClick={() => handleDateClick(day.fullDate)}
              >
                {day.date}
              </div>
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
