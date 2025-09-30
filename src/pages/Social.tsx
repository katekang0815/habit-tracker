import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authorizationChecked, setAuthorizationChecked] = useState(false);
  const [checkingInProgress, setCheckingInProgress] = useState(false);

  // Separate useEffect for initial navigation
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  // Separate useEffect for authorization check with proper guards
  useEffect(() => {
    // Guard 1: Skip if auth is loading
    if (authLoading) {
      console.log('Social: Auth is loading, skipping authorization check');
      return;
    }

    // Guard 2: Skip if no user (but only redirect after auth is done)
    if (!user) {
      console.log('Social: No authenticated user found');
      // Only navigate if we're sure auth has loaded and there's no user
      if (!authLoading) {
        navigate("/");
      }
      return;
    }

    // Guard 3: Skip if already checked OR checking is in progress
    if (authorizationChecked || checkingInProgress) {
      console.log('Social: Authorization already checked or in progress');
      return;
    }

    console.log('Social: All guards passed, starting authorization for user:', user.id);

    // Mark as checking in progress immediately
    setCheckingInProgress(true);

    // Check if user just shared from Profile page
    const navigationState = location.state as { justShared?: boolean; userId?: string; timestamp?: number } | null;
    if (navigationState?.justShared && navigationState.userId === user.id) {
      // User just shared their profile, skip database check
      const timeSinceShare = Date.now() - (navigationState.timestamp || 0);
      if (timeSinceShare < 10000) { // Within 10 seconds
        console.log('Social: User just shared profile, skipping authorization check');
        setAuthorizationChecked(true);
        setCheckingInProgress(false);
        fetchSharedUsers();
        // Clear the navigation state to prevent reuse
        navigate(location.pathname, { replace: true });
        return;
      }
    }

    const checkAuthAndFetch = async () => {
      // Store user ID to prevent issues if user becomes null
      const currentUserId = user?.id;
      if (!currentUserId) {
        console.warn('Social: No user ID available');
        setCheckingInProgress(false);
        return;
      }

      try {
        // Give database a moment to catch up
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('Social: Checking authorization for user:', currentUserId);
        let isAuthorized = await checkUserAuthorization(user);
        
        // If not authorized, try a few more times with delays
        const retryDelays = [1000, 1500, 2000];
        let retryCount = 0;
        
        while (!isAuthorized && retryCount < retryDelays.length) {
          console.log(`Social: Authorization attempt ${retryCount + 2} failed, retrying in ${retryDelays[retryCount]}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount]));
          
          // Check if component is still mounted and user exists
          if (!user || user.id !== currentUserId) {
            console.warn('Social: User changed or became null during retry');
            setCheckingInProgress(false);
            return;
          }
          
          isAuthorized = await checkUserAuthorization(user);
          retryCount++;
        }
        
        // Only update state if user hasn't changed
        if (user && user.id === currentUserId) {
          setAuthorizationChecked(true);
          setCheckingInProgress(false);
          
          if (!isAuthorized) {
            console.log('Social: Authorization failed after all attempts');
            // Import toast dynamically to avoid issues
            import("@/hooks/use-toast").then(({ toast }) => {
              toast({
                title: "Access Denied",
                description: "Please share your profile with LinkedIn URL to access the Social page",
                variant: "destructive",
              });
            });
            
            // Small delay before redirect for UX
            setTimeout(() => {
              navigate("/profile");
            }, 500);
          } else {
            console.log('Social: User authorized successfully');
            fetchSharedUsers();
          }
        }
      } catch (error) {
        console.error('Social: Error during authorization check:', error);
        setCheckingInProgress(false);
      }
    };

    // Execute the check
    checkAuthAndFetch();
  }, [user, authLoading, authorizationChecked, checkingInProgress, navigate, checkUserAuthorization, fetchSharedUsers, location]);

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
