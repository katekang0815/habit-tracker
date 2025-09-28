import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Habit } from "@/hooks/useHabits";

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  onEditHabit: (habitId: string, name: string, emoji?: string) => void;
  existingHabits: Habit[];
}

// Common emoji options - same as AddHabitDialog
const emojiOptions = [
  '🏃', '💪', '📚', '💧', '🧘', '🍎', '💻', '🎯', '✍️', '🌱',
  '🎵', '🎨', '🔥', '⭐', '💎', '🚀', '⚡', '🌟', '✨', '🎪'
];

export function EditHabitDialog({ 
  open, 
  onOpenChange, 
  habit, 
  onEditHabit, 
  existingHabits 
}: EditHabitDialogProps) {
  const [habitName, setHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  // Update form when habit changes
  useEffect(() => {
    if (habit) {
      setHabitName(habit.name);
      setSelectedEmoji(habit.emoji || "");
    }
  }, [habit]);

  const handleSave = () => {
    if (habitName.trim() && habit) {
      const finalEmoji = selectedEmoji || habit.emoji || "";
      onEditHabit(habit.id, habitName.trim(), finalEmoji);
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && habitName.trim()) {
      handleSave();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Check for duplicate names (excluding the current habit)
  const isDuplicateName = habitName.trim() && existingHabits.some(
    h => h.id !== habit?.id && h.name.toLowerCase() === habitName.trim().toLowerCase()
  );

  const canSave = habitName.trim() && !isDuplicateName && habitName.trim() !== habit?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Edit Habit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {isDuplicateName && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                A habit with this name already exists.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="edit-habit-name" className="text-sm font-medium text-foreground">
              Habit Name
            </Label>
            <Input
              id="edit-habit-name"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Enter habit name"
              onKeyPress={handleKeyPress}
              className="bg-background/50 border-border/70 focus:border-primary"
              autoFocus
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Choose an emoji (optional)
            </Label>
            <div className="grid grid-cols-10 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                    selectedEmoji === emoji
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmoji("")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
              {selectedEmoji && (
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedEmoji}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-primary hover:bg-primary-glow text-primary-foreground"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}