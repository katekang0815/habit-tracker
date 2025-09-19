import { Home, Plus, BarChart3, Users, Pause, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface BottomNavigationProps {
  onAddClick: () => void;
  user: SupabaseUser | null;
  onSignOut: () => void;
}

const BottomNavigation = ({ onAddClick, user, onSignOut }: BottomNavigationProps) => {
  const [showSignOut, setShowSignOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Plus, label: "Add", isAdd: true },
    { icon: BarChart3, label: "Stats", path: "/statistics" },
    { icon: Users, label: "Social" },
    { icon: Pause, label: "Break", path: "/vacation" },
    { icon: User, label: "Profile", path: "/profile" },
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
          
          if (item.label === "Profile" && user) {
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => {
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  setShowSignOut(true);
                }}
                onMouseLeave={() => {
                  timeoutRef.current = setTimeout(() => {
                    setShowSignOut(false);
                  }, 500);
                }}
              >
                <button
                  onClick={() => navigate("/profile")}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === "/profile"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
                
                {showSignOut && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-max">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSignOut}
                      className="flex items-center gap-2 text-sm hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === item.path
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