import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVacationSchedules } from "@/hooks/useVacationSchedules";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatPacificDateString } from "@/lib/pacific-time";

const Vacation = () => {
  const { user } = useAuth();
  const { addVacationSchedule, updateVacationSchedule, vacationSchedules, deleteVacationSchedule } = useVacationSchedules();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [scheduledVacation, setScheduledVacation] = useState<{start: Date, end: Date, id?: string} | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
  };

  const handleScheduleVacation = async () => {
    if (!startDate || !endDate || !user) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    try {
      await addVacationSchedule.mutateAsync({
        start_date: formatPacificDateString(startDate),
        end_date: formatPacificDateString(endDate),
      });

      setScheduledVacation({ start: startDate, end: endDate });
      
      // Reset dates
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule vacation",
        variant: "destructive",
      });
    }
  };

  const handleCancelVacation = async () => {
    if (scheduledVacation?.id) {
      // Find and delete the actual vacation schedule
      const schedule = vacationSchedules.find(s => s.id === scheduledVacation.id);
      if (schedule) {
        await deleteVacationSchedule.mutateAsync(schedule.id);
      }
    }
    
    // Show canceling notification
    toast({
      title: "Vacation canceled",
      description: "Your vacation schedule has been removed.",
    });
    
    setScheduledVacation(null);
    setHasChanges(false);
  };

  const handleUpdateVacation = async () => {
    if (!scheduledVacation?.id) return;
    
    try {
      await updateVacationSchedule.mutateAsync({
        id: scheduledVacation.id,
        start_date: formatPacificDateString(scheduledVacation.start),
        end_date: formatPacificDateString(scheduledVacation.end),
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vacation",
        variant: "destructive",
      });
    }
  };

  // Check if there's an existing vacation schedule and set it
  React.useEffect(() => {
    if (vacationSchedules.length > 0 && !scheduledVacation) {
      const latestSchedule = vacationSchedules[0]; // Get the first/latest schedule
      setScheduledVacation({
        start: new Date(latestSchedule.start_date),
        end: new Date(latestSchedule.end_date),
        id: latestSchedule.id
      });
    }
  }, [vacationSchedules, scheduledVacation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 relative overflow-hidden">
      {/* Beach Vacation Illustration */}
      <div className="absolute top-0 right-0 w-full h-80 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Sky gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200" />
          
          {/* Clouds */}
          <div className="absolute top-8 right-20 w-16 h-8 bg-white rounded-full opacity-80" />
          <div className="absolute top-12 right-32 w-12 h-6 bg-white rounded-full opacity-70" />
          <div className="absolute top-6 right-60 w-20 h-10 bg-white rounded-full opacity-75" />
          
          {/* Sun */}
          <div className="absolute top-8 right-8 w-12 h-12 bg-yellow-300 rounded-full" />
          
          {/* Mountains/hills */}
          <div className="absolute bottom-20 right-0 w-32 h-16 bg-green-200 rounded-l-full" />
          <div className="absolute bottom-16 right-16 w-40 h-20 bg-green-300 rounded-l-full" />
          
          {/* Beach */}
          <div className="absolute bottom-0 right-0 w-full h-20 bg-gradient-to-l from-yellow-200 to-yellow-100" />
          
          {/* Palm tree */}
          <div className="absolute bottom-12 right-40 w-2 h-16 bg-amber-700 rounded-full" />
          <div className="absolute bottom-24 right-36 w-8 h-4 bg-green-400 rounded-full transform -rotate-12" />
          <div className="absolute bottom-26 right-38 w-6 h-3 bg-green-500 rounded-full transform rotate-12" />
          
          {/* Flamingo */}
          <div className="absolute bottom-16 right-60 w-8 h-12 rounded-full">
            <div className="w-3 h-8 bg-pink-300 rounded-full mx-auto" />
            <div className="w-4 h-4 bg-pink-400 rounded-full mt-1 ml-1" />
          </div>
          
          {/* Cool character with sunglasses */}
          <div className="absolute bottom-20 right-20 w-16 h-16">
            <div className="w-12 h-12 bg-green-400 rounded-full mx-auto relative">
              {/* Sunglasses */}
              <div className="absolute top-3 left-1 w-10 h-3 bg-black rounded-full opacity-80" />
              <div className="absolute top-3 left-2 w-3 h-3 bg-gray-800 rounded-full" />
              <div className="absolute top-3 right-2 w-3 h-3 bg-gray-800 rounded-full" />
            </div>
            {/* Hat */}
            <div className="absolute -top-2 left-1 w-14 h-6 bg-yellow-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Go on Vacation</h1>
          <div className="space-y-1">
            <p className="text-muted-foreground">Feel free to take a break :)</p>
            <p className="text-muted-foreground">Rest up!</p>
          </div>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-lg mb-8">
          <CardContent className="p-6">
            {scheduledVacation ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-2">Your vacation is scheduled 🌿</h2>
                  <p className="text-muted-foreground text-sm">
                    Tap the date below to edit the period.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    {/* From Date */}
                    <div className="flex flex-col items-center">
                      <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="text-lg font-medium text-foreground border-b-2 border-primary bg-transparent rounded-none hover:bg-transparent px-2 py-1"
                          >
                            {format(scheduledVacation.start, "MMMM d, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledVacation.start}
                            onSelect={(date) => {
                              if (date) {
                                setScheduledVacation({ ...scheduledVacation, start: date });
                                setHasChanges(true);
                                setShowStartCalendar(false);
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <span className="text-muted-foreground font-medium text-lg">–</span>

                    {/* To Date */}
                    <div className="flex flex-col items-center">
                      <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="text-lg font-medium text-foreground border-b-2 border-primary bg-transparent rounded-none hover:bg-transparent px-2 py-1"
                          >
                            {format(scheduledVacation.end, "MMMM d, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledVacation.end}
                            onSelect={(date) => {
                              if (date) {
                                setScheduledVacation({ ...scheduledVacation, end: date });
                                setHasChanges(true);
                                setShowEndCalendar(false);
                              }
                            }}
                            disabled={(date) => date < (scheduledVacation.start || new Date())}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {hasChanges && (
                    <Button 
                      onClick={() => {
                        setHasChanges(false);
                        handleUpdateVacation();
                      }}
                      className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-medium py-3 mb-2"
                    >
                      Save Changes
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleCancelVacation}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-foreground mb-2">Set Vacation Duration</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Your routines will be paused and grayed out during your vacation
                </p>

                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    {/* From Date */}
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground mb-2">From</span>
                      <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-32 h-12 text-sm font-medium border-b-2 border-primary bg-transparent rounded-none",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              setShowStartCalendar(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <span className="text-muted-foreground font-medium">to</span>

                    {/* To Date */}
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground mb-2">To</span>
                      <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-32 h-12 text-sm font-medium border-b-2 border-primary bg-transparent rounded-none",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              setShowEndCalendar(false);
                            }}
                            disabled={(date) => date < (startDate || new Date())}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {startDate && endDate && (
                    <Button 
                      onClick={handleScheduleVacation}
                      className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-medium py-3"
                    >
                      Schedule Vacation
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation 
        onAddClick={() => {}} 
        user={user} 
        onSignOut={handleSignOut} 
      />
    </div>
  );
};

export default Vacation;