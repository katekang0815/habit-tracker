import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocialSharing } from "@/hooks/useSocialSharing";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import UserStatisticsModal from "@/components/UserStatisticsModal";

const Social = () => {
  const { user, loading: authLoading } = useAuth();
  const { sharedUsers, loading, fetchSharedUsers, checkUserAuthorization } = useSocialSharing();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authorizationChecked, setAuthorizationChecked] = useState(false);

  // Separate useEffect for initial navigation
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  // Separate useEffect for authorization check
  useEffect(() => {
    // Wait for auth to be fully loaded
    if (authLoading) {
      console.log('Social: Auth still loading, waiting...');
      return;
    }

    // If no user after auth loaded, redirect to home
    if (!user) {
      console.log('Social: No user found after auth loaded');
      navigate("/");
      return;
    }

    // Don't check again if already checked
    if (authorizationChecked) {
      return;
    }

    console.log('Social: Starting authorization check for user:', user.id);

    const checkAuthAndFetch = async () => {
      // Give a moment for any pending database operations
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let isAuthorized = await checkUserAuthorization();
      
      // Retry logic with longer delay
      if (!isAuthorized) {
        console.log('Social: First authorization check failed, retrying in 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        isAuthorized = await checkUserAuthorization();
      }
      
      // Final retry with even longer delay
      if (!isAuthorized) {
        console.log('Social: Second authorization check failed, final retry in 1.5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        isAuthorized = await checkUserAuthorization();
      }
      
      setAuthorizationChecked(true);
      
      if (!isAuthorized) {
        console.log('Social: Authorization failed after all retries');
        // Show a toast message explaining why they're being redirected
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Access Denied",
          description: "Please share your profile with LinkedIn URL to access the Social page",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate("/profile");
        }, 100);
        return;
      }
      
      console.log('Social: User authorized, fetching shared users');
      // User is authorized, fetch shared users
      fetchSharedUsers();
    };

    checkAuthAndFetch();
  }, [user, authLoading, authorizationChecked, navigate, checkUserAuthorization, fetchSharedUsers]);

  const handleUserCardClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddClick = () => {
    navigate("/");
  };

  if (authLoading || !authorizationChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Social</h1>
          <p className="text-muted-foreground">Discover and connect with other habit builders</p>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3 p-6 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : sharedUsers.length > 0 ? (
            sharedUsers.map((user) => (
              <UserProfileCard
                key={user.user_id}
                user={user}
                onClick={handleUserCardClick}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No shared profiles yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share your profile!
              </p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation 
        onAddClick={handleAddClick}
        user={user}
        onSignOut={handleSignOut}
      />

      <UserStatisticsModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Social;
