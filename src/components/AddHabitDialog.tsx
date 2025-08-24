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

interface Habit {
  id: string;
  name: string;
  emoji?: string;
  is_active: boolean;
  completed?: boolean;
  can_toggle?: boolean;
}

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHabit: (name: string, emoji?: string) => void;
  existingHabits: Habit[];
}

const commonEmojis = [
  "💪", "🧘", "📚", "💧", "🥗", "🏃", "🌅", "💊", "🛏️", "🚿",
  "🎯", "⚡", "🔥", "🎨", "🎵", "🌱", "☀️", "🧠", "❤️", "✨",
  "🏋️", "🚴", "🏊", "🎸", "📝", "🍎", "🥛", "🌿", "🔔", "📱"
];

// Icon categories for rotating selection
const iconCategories = {
  water: ['💧', '🌊', '🥤', '🍶'],
  exercise: ['💪', '🏋️', '🤸', '⚡'],
  reading: ['📚', '📖', '🔍', '🧠'],
  meditation: ['🧘', '🙏', '☯️', '🕯️'],
  running: ['🏃', '👟', '🏃‍♀️', '🏃‍♂️'],
  sleep: ['🛏️', '😴', '🌙', '💤'],
  hygiene: ['🚿', '🛁', '🧼', '🪥'],
  food: ['🥗', '🍎', '🥕', '🍽️'],
  medicine: ['💊', '💉', '🩺', '⚕️'],
  morning: ['🌅', '☀️', '🌄', '🐓'],
  writing: ['📝', '✍️', '📔', '🖊️'],
  music: ['🎵', '🎶', '🎧', '🎤'],
  art: ['🎨', '🖌️', '🖍️', '🎭'],
  cycling: ['🚴', '🚲', '🚴‍♀️', '🚴‍♂️'],
  swimming: ['🏊', '🏊‍♀️', '🏊‍♂️', '🌊'],
  instruments: ['🎸', '🎹', '🥁', '🎺'],
  healthy: ['🍎', '🥬', '🥑', '🫐'],
  drinks: ['🥛', '🧃', '☕', '🍵'],
  plants: ['🌱', '🌿', '🪴', '🌳'],
  goals: ['🎯', '🏆', '⭐', '🔥'],
  energy: ['⚡', '🔋', '💥', '🌟'],
  passion: ['🔥', '❤️‍🔥', '💖', '💯'],
  brain: ['🧠', '💡', '🤔', '🎓'],
  love: ['❤️', '💖', '💝', '🥰'],
  shine: ['✨', '🌟', '💫', '⭐'],
  strength: ['🏋️', '💪', '🦾', '⚡'],
  sun: ['☀️', '🌞', '🌅', '🌻'],
  alerts: ['🔔', '⏰', '📢', '🚨'],
  digital: ['📱', '💻', '⌚', '📲'],
  nature: ['🌿', '🍃', '🌳', '🌺'],
  fallback: ['✨', '⭐', '💎', '🔥', '🎯', '💪', '🌟', '⚡']
};

// Auto-assign icons based on habit keywords with rotation
const getAutoIcon = (habitName: string, existingHabits: any[]): string => {
  const name = habitName.toLowerCase();
  const usedEmojis = existingHabits.map(h => h.emoji).filter(Boolean);
  
  const selectFromCategory = (categoryKey: keyof typeof iconCategories) => {
    const icons = iconCategories[categoryKey];
    // Find first icon in category not used by existing habits
    const unusedIcon = icons.find(icon => !usedEmojis.includes(icon));
    return unusedIcon || icons[usedEmojis.length % icons.length];
  };
  
  if (name.includes('water') || name.includes('drink') || name.includes('hydrat')) 
    return selectFromCategory('water');
  if (name.includes('exercise') || name.includes('workout') || name.includes('gym')) 
    return selectFromCategory('exercise');
  if (name.includes('read') || name.includes('book') || name.includes('study')) 
    return selectFromCategory('reading');
  if (name.includes('meditat') || name.includes('mindful') || name.includes('breath')) 
    return selectFromCategory('meditation');
  if (name.includes('run') || name.includes('jog') || name.includes('cardio')) 
    return selectFromCategory('running');
  if (name.includes('sleep') || name.includes('rest') || name.includes('bed')) 
    return selectFromCategory('sleep');
  if (name.includes('shower') || name.includes('bath') || name.includes('clean')) 
    return selectFromCategory('hygiene');
  if (name.includes('eat') || name.includes('meal') || name.includes('nutrition')) 
    return selectFromCategory('food');
  if (name.includes('vitamin') || name.includes('pill') || name.includes('medicine')) 
    return selectFromCategory('medicine');
  if (name.includes('wake') || name.includes('morning') || name.includes('early')) 
    return selectFromCategory('morning');
  if (name.includes('write') || name.includes('journal') || name.includes('diary')) 
    return selectFromCategory('writing');
  if (name.includes('music') || name.includes('song') || name.includes('listen')) 
    return selectFromCategory('music');
  if (name.includes('art') || name.includes('draw') || name.includes('paint')) 
    return selectFromCategory('art');
  if (name.includes('bike') || name.includes('cycle') || name.includes('cycling')) 
    return selectFromCategory('cycling');
  if (name.includes('swim') || name.includes('pool')) 
    return selectFromCategory('swimming');
  if (name.includes('guitar') || name.includes('instrument') || name.includes('practice')) 
    return selectFromCategory('instruments');
  if (name.includes('fruit') || name.includes('apple') || name.includes('healthy')) 
    return selectFromCategory('healthy');
  if (name.includes('milk') || name.includes('protein') || name.includes('shake')) 
    return selectFromCategory('drinks');
  if (name.includes('plant') || name.includes('garden') || name.includes('green')) 
    return selectFromCategory('plants');
  if (name.includes('goal') || name.includes('target') || name.includes('focus')) 
    return selectFromCategory('goals');
  if (name.includes('energy') || name.includes('power') || name.includes('boost')) 
    return selectFromCategory('energy');
  if (name.includes('passion') || name.includes('fire') || name.includes('burn')) 
    return selectFromCategory('passion');
  if (name.includes('brain') || name.includes('think') || name.includes('mental')) 
    return selectFromCategory('brain');
  if (name.includes('love') || name.includes('heart') || name.includes('care')) 
    return selectFromCategory('love');
  if (name.includes('shine') || name.includes('glow') || name.includes('sparkle')) 
    return selectFromCategory('shine');
  if (name.includes('lift') || name.includes('weight') || name.includes('strength')) 
    return selectFromCategory('strength');
  if (name.includes('sun') || name.includes('bright') || name.includes('light')) 
    return selectFromCategory('sun');
  if (name.includes('remind') || name.includes('alert') || name.includes('notification')) 
    return selectFromCategory('alerts');
  if (name.includes('phone') || name.includes('app') || name.includes('digital')) 
    return selectFromCategory('digital');
  if (name.includes('nature') || name.includes('leaf') || name.includes('organic')) 
    return selectFromCategory('nature');
  
  // Default fallback with rotation
  return selectFromCategory('fallback');
};

const AddHabitDialog = ({ open, onOpenChange, onAddHabit, existingHabits }: AddHabitDialogProps) => {
  const [habitName, setHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const handleSave = () => {
    if (habitName.trim()) {
      const finalEmoji = selectedEmoji || getAutoIcon(habitName.trim(), existingHabits);
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