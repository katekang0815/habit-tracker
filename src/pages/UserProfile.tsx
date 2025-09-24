import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHabitStatistics } from "@/hooks/useHabitStatistics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  linkedin: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentDate] = useState(new Date());

  // Create a mock user object for statistics hook
  const mockUser = profile ? { id: profile.user_id } as any : null;
  const { habitStats, loading: statsLoading } = useHabitStatistics(mockUser, currentDate);

  useEffect(() => {
    if (!userId) {
      navigate('/social');
      return;
    }

    fetchUserProfile();
  }, [userId, navigate]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio, linkedin')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user profile",
          variant: "destructive",
        });
        navigate('/social');
        return;
      }

      if (!data) {
        toast({
          title: "User not found",
          description: "The requested user profile does not exist",
          variant: "destructive",
        });
        navigate('/social');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      });
      navigate('/social');
    } finally {
      setProfileLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getHabitColor = (index: number) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    return colors[index % colors.length];
  };

  const renderCalendarGrid = (habit: any, habitColor: string) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCompleted = habit.completedDays.includes(day);
      days.push(
        <div
          key={day}
          className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium ${
            isCompleted
              ? 'text-white'
              : 'bg-muted text-muted-foreground'
          }`}
          style={isCompleted ? { backgroundColor: habitColor } : {}}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 pb-20">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </main>
        <BottomNavigation
          onAddClick={() => {}}
          user={user}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 pb-20">
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-6 mb-8">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-semibold">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
          
          <div className="flex space-x-4">
            {profile.linkedin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(profile.linkedin, '_blank')}
              >
                <Linkedin className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // Placeholder for Notion URL
                toast({
                  title: "Coming Soon",
                  description: "Notion integration will be available soon",
                });
              }}
            >
              <ExternalLink className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Habit Statistics */}
        <div className="space-y-6">
          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : habitStats.length > 0 ? (
            habitStats.map((habit, index) => (
              <Card key={habit.habitId}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{habit.emoji}</span>
                    <span>{habit.habitName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderCalendarGrid(habit, getHabitColor(index))}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{Math.round(habit.completionPercentage)}%</span>
                    <span>● {habit.completedCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No habit data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNavigation
        onAddClick={() => {}}
        user={user}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default UserProfile;