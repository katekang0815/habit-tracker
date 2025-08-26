import { useState, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHabitStatistics } from "@/hooks/useHabitStatistics";

const Statistics = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const { habitStats, loading } = useHabitStatistics(user, currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendarGrid = (completedDays: Set<number>, habitColor: string) => {
    const daysInMonth = getDaysInMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="grid grid-cols-7 gap-1 mt-3">
        {days.map((day) => (
          <div
            key={day}
            className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium transition-all ${
              completedDays.has(day)
                ? `${habitColor} text-white`
                : "bg-muted/30 text-muted-foreground"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const getHabitColor = (index: number) => {
    const colors = [
      "bg-emerald-400",
      "bg-amber-400", 
      "bg-red-400",
      "bg-green-400",
      "bg-blue-400",
      "bg-purple-400"
    ];
    return colors[index % colors.length];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">Statistics</h2>
          <p className="text-muted-foreground">Please sign in to view your habit statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Statistics</h1>
          
          <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            
            <Button
              variant="ghost" 
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Habit Statistics */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : habitStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No habits found for this month</p>
            </div>
          ) : (
            habitStats.map((stat, index) => (
              <Card key={stat.habitId} className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="flex items-start gap-3 mb-3">
                  {stat.emoji && (
                    <span className="text-2xl">{stat.emoji}</span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{stat.habitName}</h3>
                  </div>
                </div>

                {renderCalendarGrid(stat.completedDays, getHabitColor(index))}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                    <span className="text-sm font-medium text-foreground">
                      {stat.completionPercentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-foreground"></div>
                    <span className="text-sm font-medium text-foreground">
                      {stat.completedCount}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;