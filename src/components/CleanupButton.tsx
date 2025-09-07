import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const CleanupButton = () => {
  const { toast } = useToast();

  const runCleanup = async () => {
    try {
      console.log('Running cleanup...');
      
      const { data, error } = await supabase.functions.invoke('migrate-habits', {
        body: { action: 'cleanup' }
      });

      if (error) {
        console.error('Cleanup error:', error);
        toast({
          title: "Error",
          description: "Failed to run cleanup",
          variant: "destructive",
        });
        return;
      }

      console.log('Cleanup result:', data);
      toast({
        title: "Success",
        description: "Old habit completions cleaned up successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to run cleanup",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={runCleanup} variant="destructive">
      Run Cleanup (Remove Historical Data)
    </Button>
  );
};