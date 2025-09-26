import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHabitStatistics } from "@/hooks/useHabitStatistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth } from "date-fns";
import { toPacificDate } from "@/lib/pacific-time";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  display_name: string;
  bio?: string;
}

interface UserStatisticsModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserStatisticsModal = ({ userId, isOpen, onClose }: UserStatisticsModalProps) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const { habitStats, loading: statsLoading } = useHabitStatistics(user, currentDate, userId || undefined);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile();
    }
  }, [userId, isOpen]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, bio')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "User not found",
          description: "This user profile is not available.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try again.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setProfileLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const getHabitColor = (index: number) => {
    const colors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 'text-red-500', 'text-yellow-500'];
    return colors[index % colors.length];
  };

  const getHabitBackgroundColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500'];
    return colors[index % colors.length];
  };

  const renderCalendarGrid = (habit: any, habitIndex: number) => {
    const pacificDate = toPacificDate(currentDate);
    const daysInMonth = getDaysInMonth(pacificDate);
    const monthStart = startOfMonth(pacificDate);
    const startDay = monthStart.getDay();

    return (
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center font-medium text-muted-foreground p-1">
            {day}
          </div>
        ))}
        
        {Array.from({ length: startDay }, (_, i) => (
          <div key={`empty-${i}`} className="p-1"></div>
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isCompleted = habit.completedDays.has(day);
          
          return (
            <div
              key={day}
                className={`
                p-0 h-6 w-6 flex items-center justify-center rounded-sm text-xs font-medium transition-all
                ${isCompleted 
                  ? `${getHabitBackgroundColor(habitIndex)} text-white` 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  const displayName = userProfile?.display_name || 'Unknown User';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-10">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>

        {profileLoading ? (
          <div className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="border-b-2 border-slate-200  p-4 shadow-sm">
              <div className="flex items-center gap-4">
                {/* Avatar with First Letter */}
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
                  {firstLetter}
                </div>
                
                {/* User Info */}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                </div>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-xl font-semibold text-foreground">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Statistics Grid */}
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-0.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : habitStats.length === 0 ? (
              <Card className="col-span-2 text-center py-4">
                <CardContent>
                  <p className="text-muted-foreground">No habit data available for this user in {format(currentDate, 'MMMM yyyy')}.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {habitStats.map((habit, index) => (
                  <Card key={habit.habitId} className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-start gap-2">
                        {habit.emoji && <span className="text-lg border-2 border-red-600">{habit.emoji}</span>}
                        <span className="truncate text-sm font-semibold">{habit.habitName}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      {renderCalendarGrid(habit, index)}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className={`p-1 text-xs font-semibold ${getHabitColor(index)}`}>
                          {habit.completionPercentage}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserStatisticsModal;