import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVacationSchedules } from "@/hooks/useVacationSchedules";

interface VacationSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  endDate: Date;
  onCancel: () => void;
}

export const VacationSuccessDialog = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  onCancel,
}: VacationSuccessDialogProps) => {
  const { vacationSchedules, deleteVacationSchedule } = useVacationSchedules();

  const handleCancel = async () => {
    // Find the vacation schedule that matches our dates
    const schedule = vacationSchedules.find(s => 
      s.start_date === format(startDate, "yyyy-MM-dd") && 
      s.end_date === format(endDate, "yyyy-MM-dd")
    );

    if (schedule) {
      await deleteVacationSchedule.mutateAsync(schedule.id);
    }
    
    onCancel();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader className="text-center space-y-4">
          {/* Vacation Illustration */}
          <div className="mx-auto w-24 h-24 relative">
            {/* Sky background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 rounded-full" />
            
            {/* Sun */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-300 rounded-full" />
            
            {/* Cool character with sunglasses */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12">
              <div className="w-10 h-10 bg-green-400 rounded-full mx-auto relative">
                {/* Sunglasses */}
                <div className="absolute top-2 left-1 w-8 h-2 bg-black rounded-full opacity-80" />
                <div className="absolute top-2 left-1.5 w-2 h-2 bg-gray-800 rounded-full" />
                <div className="absolute top-2 right-1.5 w-2 h-2 bg-gray-800 rounded-full" />
              </div>
              {/* Hat */}
              <div className="absolute -top-1 left-0 w-12 h-4 bg-yellow-400 rounded-full" />
            </div>
            
            {/* Palm leaf decoration */}
            <div className="absolute bottom-0 right-0 w-4 h-6 bg-green-400 rounded-full transform rotate-12" />
          </div>

          <DialogTitle className="text-lg font-semibold">Go on Vacation</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="text-muted-foreground">Feel free to take a break :)</p>
            <p className="text-muted-foreground">Rest up!</p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-2">Your vacation is scheduled 🌿</p>
            <p className="text-xs text-muted-foreground">Tap the date below to edit the period.</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              {format(startDate, "MMMM d, yyyy")} – {format(endDate, "MMMM d, yyyy")}
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};