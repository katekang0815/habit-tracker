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

const commonEmojis = ["💪", "🧘", "📚", "💧", "🥗", "🏃", "🌅", "💊", "🛏️", "🚿"];

const AddHabitDialog = ({ open, onOpenChange, onAddHabit }: AddHabitDialogProps) => {
  const [habitName, setHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const handleSave = () => {
    if (habitName.trim()) {
      onAddHabit(habitName.trim(), selectedEmoji);
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
            <div className="grid grid-cols-5 gap-2">
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