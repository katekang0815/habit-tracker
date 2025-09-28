import { useState } from "react";
import { Check, StarHalf, Sparkle, MoreVertical, Trash2, Pause, Play, GripVertical, Edit2 } from "lucide-react";
import { DeleteHabitDialog } from "@/components/DeleteHabitDialog";
import { EditHabitDialog } from "@/components/EditHabitDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Habit {
  id: string;
  name: string;
  emoji?: string;
  is_active: boolean;
  completed?: boolean;
  can_toggle?: boolean;
  order_index?: number;
}

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onPauseHabit: (id: string) => void;
  onActivateHabit: (id: string) => void;
  onEditHabit: (habitId: string, name: string, emoji?: string) => void;
  onReorderHabits: (habitIds: string[]) => void;
  isVacationDate?: boolean;
  isHistoricalDate?: boolean;
  canReorder?: boolean;
}

// Sortable habit item component
interface SortableHabitItemProps {
  habit: Habit;
  index: number;
  animatingHabits: Set<string>;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onPauseHabit: (id: string) => void;
  onActivateHabit: (id: string) => void;
  onOpenDeleteDialog: (habit: Habit) => void;
  onOpenEditDialog: (habit: Habit) => void;
  isVacationDate: boolean;
  isHistoricalDate: boolean;
  canReorder: boolean;
}

const SortableHabitItem = ({ 
  habit, 
  index, 
  animatingHabits, 
  onToggleHabit, 
  onDeleteHabit, 
  onPauseHabit, 
  onActivateHabit, 
  onOpenDeleteDialog,
  onOpenEditDialog,
  isVacationDate, 
  isHistoricalDate,
  canReorder 
}: SortableHabitItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleHabit = (id: string) => {
    const currentHabit = habit;
    
    // Don't allow toggling if habit can't be toggled (not today, future date, or inactive habit)
    if (!currentHabit?.can_toggle || !currentHabit?.is_active) return;
    
    onToggleHabit(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
        !habit.can_toggle ? 'opacity-90' : ''
      } ${isVacationDate ? 'opacity-40 grayscale' : ''} ${!habit.is_active ? 'opacity-40 grayscale' : ''} ${
        isDragging ? 'opacity-50 scale-105 z-50' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {canReorder && (
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-muted/50 rounded transition-colors duration-200 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        
        <span className="text-lg font-medium text-muted-foreground">
          {index + 1}
        </span>
        
        <div className="flex items-center gap-3 flex-1">
          {habit.emoji && (
            <span className="text-xl">{habit.emoji}</span>
          )}
          <span className={`font-medium transition-all duration-300 text-foreground ${
            isVacationDate ? 'line-through text-muted-foreground' : ''
          } ${!habit.is_active ? 'text-muted-foreground' : ''}`}>
            {habit.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => handleToggleHabit(habit.id)}
              disabled={!habit.can_toggle}
              className={`w-8 h-8 rounded-full border-2 border-border/50 bg-background/50 hover:bg-card transition-all duration-300 flex items-center justify-center relative ${
                !habit.can_toggle ? 'cursor-not-allowed opacity-90' : ''
              }`}
            >
              {habit.completed && (
                <Check className={`w-4 h-4 text-habit-complete ${animatingHabits.has(habit.id) ? 'animate-spark' : ''}`} />
              )}
            </button>
            
            {/* Sparkle animation */}
            {animatingHabits.has(habit.id) && (
              <>
                <Sparkle className="absolute -top-1 -right-1 w-3 h-3 text-habit-complete animate-sparkle" style={{ animationDelay: '0ms' }} />
                <Sparkle className="absolute -bottom-1 -left-1 w-3 h-3 text-habit-complete animate-sparkle" style={{ animationDelay: '200ms' }} />
                <Sparkle className="absolute top-0 -left-1 w-2 h-2 text-habit-complete animate-sparkle" style={{ animationDelay: '400ms' }} />
              </>
            )}
          </div>

          {!isHistoricalDate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full hover:bg-muted/50 transition-colors duration-200 flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onOpenEditDialog(habit)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                {habit.is_active ? (
                  <DropdownMenuItem
                    onClick={() => onPauseHabit(habit.id)}
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onActivateHabit(habit.id)}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onOpenDeleteDialog(habit)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

const HabitList = ({ 
  habits, 
  onToggleHabit, 
  onDeleteHabit, 
  onPauseHabit, 
  onActivateHabit, 
  onEditHabit,
  onReorderHabits, 
  isVacationDate = false, 
  isHistoricalDate = false,
  canReorder = false 
}: HabitListProps) => {
  const [animatingHabits, setAnimatingHabits] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    
    // Don't allow toggling if habit can't be toggled (not today, future date, or inactive habit)
    if (!habit?.can_toggle || !habit?.is_active) return;
    
    // If habit is being marked as complete, trigger animation
    if (habit && !habit.completed) {
      setAnimatingHabits(prev => new Set(prev).add(id));
      
      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 800);
    }
    
    onToggleHabit(id);
  };

  const handleOpenDeleteDialog = (habit: Habit) => {
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (habitToDelete) {
      onDeleteHabit(habitToDelete.id);
      setHabitToDelete(null);
    }
  };

  const handleOpenEditDialog = (habit: Habit) => {
    setHabitToEdit(habit);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = (habitId: string, name: string, emoji?: string) => {
    onEditHabit(habitId, name, emoji);
    setHabitToEdit(null);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = habits.findIndex(habit => habit.id === active.id);
      const newIndex = habits.findIndex(habit => habit.id === over?.id);
      
      const newOrder = arrayMove(habits, oldIndex, newIndex);
      onReorderHabits(newOrder.map(habit => habit.id));
    }
  }

  if (!canReorder) {
    // Non-draggable version for historical/vacation dates
    return (
      <>
        <div className="space-y-3">
          {habits.map((habit, index) => (
            <SortableHabitItem
              key={habit.id}
              habit={habit}
              index={index}
              animatingHabits={animatingHabits}
              onToggleHabit={handleToggleHabit}
              onDeleteHabit={onDeleteHabit}
              onPauseHabit={onPauseHabit}
              onActivateHabit={onActivateHabit}
              onOpenDeleteDialog={handleOpenDeleteDialog}
              onOpenEditDialog={handleOpenEditDialog}
              isVacationDate={isVacationDate}
              isHistoricalDate={isHistoricalDate}
              canReorder={false}
            />
          ))}
        </div>
        
        <DeleteHabitDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          habitName={habitToDelete?.name || ""}
          onConfirm={handleConfirmDelete}
        />
        
        <EditHabitDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          habit={habitToEdit}
          onEditHabit={handleConfirmEdit}
          existingHabits={habits}
        />
      </>
    );
  }

  return (
    <>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {habits.map((habit, index) => (
              <SortableHabitItem
                key={habit.id}
                habit={habit}
                index={index}
                animatingHabits={animatingHabits}
                onToggleHabit={handleToggleHabit}
                onDeleteHabit={onDeleteHabit}
                onPauseHabit={onPauseHabit}
                onActivateHabit={onActivateHabit}
                onOpenDeleteDialog={handleOpenDeleteDialog}
                onOpenEditDialog={handleOpenEditDialog}
                isVacationDate={isVacationDate}
                isHistoricalDate={isHistoricalDate}
                canReorder={canReorder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
        
      <DeleteHabitDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        habitName={habitToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
      />
        
      <EditHabitDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        habit={habitToEdit}
        onEditHabit={handleConfirmEdit}
        existingHabits={habits}
      />
    </>
  );
};

export { HabitList };
