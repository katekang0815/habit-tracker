import { Home, Plus, BarChart3, Users, Pause, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BottomNavigationProps {
  onAddClick: () => void;
}

const BottomNavigation = ({ onAddClick }: BottomNavigationProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleProfileClick = () => {
    if (user) {
      // Profile/logout functionality for logged in users
      handleSignOut();
    } else {
      // Navigate to auth page for non-logged in users
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });
    }
  };

  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Plus, label: "Add", isAdd: true },
    { icon: BarChart3, label: "Stats" },
    { icon: Users, label: "Social" },
    { icon: Pause, label: "Stop" },
    { icon: user ? LogOut : User, label: user ? "Sign Out" : "Sign In", isProfile: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-3 safe-area-pb-4">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isAdd) {
            return (
              <Button
                key={item.label}
                onClick={onAddClick}
                size="sm"
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-glow text-primary-foreground shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Icon className="w-5 h-5" />
              </Button>
            );
          }

          if (item.isProfile) {
            return (
              <button
                key={item.label}
                onClick={handleProfileClick}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                {user ? (
                  <div className="flex flex-col items-center gap-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ) : (
                  <>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </button>
            );
          }
          
          return (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                item.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { BottomNavigation };