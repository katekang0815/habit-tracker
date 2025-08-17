import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHabit: (name: string, emoji?: string) => void;
}

const commonEmojis = [
  "💪", "🧘", "📚", "💧", "🥗", "🏃", "🌅", "💊", "🛏️", "🚿",
  "🎯", "⚡", "🔥", "🎨", "🎵", "🌱", "☀️", "🧠", "❤️", "✨",
  "🏋️", "🚴", "🏊", "🎸", "📝", "🍎", "🥛", "🌿", "🔔", "📱"
];

// Auto-assign icons based on habit keywords
const getAutoIcon = (habitName: string): string => {
  const name = habitName.toLowerCase();
  
  if (name.includes('water') || name.includes('drink') || name.includes('hydrat')) return '💧';
  if (name.includes('exercise') || name.includes('workout') || name.includes('gym')) return '💪';
  if (name.includes('read') || name.includes('book') || name.includes('study')) return '📚';
  if (name.includes('meditat') || name.includes('mindful') || name.includes('breath')) return '🧘';
  if (name.includes('run') || name.includes('jog') || name.includes('cardio')) return '🏃';
  if (name.includes('sleep') || name.includes('rest') || name.includes('bed')) return '🛏️';
  if (name.includes('shower') || name.includes('bath') || name.includes('clean')) return '🚿';
  if (name.includes('eat') || name.includes('meal') || name.includes('nutrition')) return '🥗';
  if (name.includes('vitamin') || name.includes('pill') || name.includes('medicine')) return '💊';
  if (name.includes('wake') || name.includes('morning') || name.includes('early')) return '🌅';
  if (name.includes('write') || name.includes('journal') || name.includes('diary')) return '📝';
  if (name.includes('music') || name.includes('song') || name.includes('listen')) return '🎵';
  if (name.includes('art') || name.includes('draw') || name.includes('paint')) return '🎨';
  if (name.includes('bike') || name.includes('cycle') || name.includes('cycling')) return '🚴';
  if (name.includes('swim') || name.includes('pool')) return '🏊';
  if (name.includes('guitar') || name.includes('instrument') || name.includes('practice')) return '🎸';
  if (name.includes('fruit') || name.includes('apple') || name.includes('healthy')) return '🍎';
  if (name.includes('milk') || name.includes('protein') || name.includes('shake')) return '🥛';
  if (name.includes('plant') || name.includes('garden') || name.includes('green')) return '🌱';
  if (name.includes('goal') || name.includes('target') || name.includes('focus')) return '🎯';
  if (name.includes('energy') || name.includes('power') || name.includes('boost')) return '⚡';
  if (name.includes('passion') || name.includes('fire') || name.includes('burn')) return '🔥';
  if (name.includes('brain') || name.includes('think') || name.includes('mental')) return '🧠';
  if (name.includes('love') || name.includes('heart') || name.includes('care')) return '❤️';
  if (name.includes('shine') || name.includes('glow') || name.includes('sparkle')) return '✨';
  if (name.includes('lift') || name.includes('weight') || name.includes('strength')) return '🏋️';
  if (name.includes('sun') || name.includes('bright') || name.includes('light')) return '☀️';
  if (name.includes('remind') || name.includes('alert') || name.includes('notification')) return '🔔';
  if (name.includes('phone') || name.includes('app') || name.includes('digital')) return '📱';
  if (name.includes('nature') || name.includes('leaf') || name.includes('organic')) return '🌿';
  
  // Default fallback icons
  return '✨';
};

const AddHabitDialog = ({ open, onOpenChange, onAddHabit }: AddHabitDialogProps) => {
  const [habitName, setHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const handleSave = () => {
    if (habitName.trim()) {
      const finalEmoji = selectedEmoji || getAutoIcon(habitName.trim());
      onAddHabit(habitName.trim(), finalEmoji);
      setHabitName("");
      setSelectedEmoji("");
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Add New Habit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name" className="text-sm font-medium text-foreground">
              Habit Name
            </Label>
            <Input
              id="habit-name"
              placeholder="Enter your habit..."
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-background/50 border-border/70 focus:border-primary"
              autoFocus
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Choose an Icon (Optional)
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-all duration-200 hover:scale-105 ${
                    selectedEmoji === emoji
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 bg-background/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!habitName.trim()}
            className="flex-1 bg-primary hover:bg-primary-glow text-primary-foreground"
          >
            Save Habit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { AddHabitDialog };