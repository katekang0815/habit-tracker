import { Home, Plus, BarChart3, Users, Pause, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  onAddClick: () => void;
}

const BottomNavigation = ({ onAddClick }: BottomNavigationProps) => {
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Plus, label: "Add", isAdd: true },
    { icon: BarChart3, label: "Stats" },
    { icon: Users, label: "Social" },
    { icon: Pause, label: "Stop" },
    { icon: User, label: "Profile" },
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