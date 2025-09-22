import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitName: string;
  onConfirm: () => void;
}

// Custom warning icon that matches the screenshot
const WarningIcon = () => (
  <div className="relative w-16 h-16 mx-auto">
    {/* Green circle background */}
    <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center relative">
      {/* Two dark spots for "eyes" */}
      <div className="absolute top-5 left-5 w-2 h-2 bg-gray-700 rounded-full"></div>
      <div className="absolute top-5 right-5 w-2 h-2 bg-gray-700 rounded-full"></div>
      {/* Red exclamation mark */}
      <div className="absolute top-1 right-1 w-2 h-7 bg-red-500 rounded-full"></div>
      <div className="absolute bottom-6 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
    </div>
  </div>
);

export function DeleteHabitDialog({
  open,
  onOpenChange,
  habitName,
  onConfirm,
}: DeleteHabitDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-8 bg-white dark:bg-gray-900 border-0 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center space-y-6">
          <WarningIcon />
          <DialogTitle className="text-2xl font-bold text-black dark:text-white px-4">
            All records will be deleted!
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed px-4">
            All habit completions will be gone. Once deleted, it cannot be recovered.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-4 justify-center mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-3"
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            onClick={handleConfirm}
            className="flex-1 text-lg font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-3"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}