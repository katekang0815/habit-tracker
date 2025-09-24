import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSocialSharing } from "@/hooks/useSocialSharing";
import { UserCard } from "@/components/UserCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Social = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { sharedUsers, loading, fetchSharedUsers } = useSocialSharing(user);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchSharedUsers();
    }
  }, [user, authLoading, navigate, fetchSharedUsers]);

  // Refresh shared users when navigating to this page (e.g., from profile after sharing)
  useEffect(() => {
    if (user && location.pathname === '/social') {
      fetchSharedUsers();
    }
  }, [location.pathname, user, fetchSharedUsers]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUserCardClick = (userId: string) => {
    navigate(`/social/user/${userId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 pb-20">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold text-foreground mb-6">Social</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Follow Routiners</h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
                  <Skeleton className="h-4 w-20 mx-auto mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : sharedUsers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sharedUsers.map((sharedUser) => (
                <UserCard
                  key={sharedUser.user_id}
                  user={sharedUser}
                  onClick={() => handleUserCardClick(sharedUser.user_id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users have shared their profiles yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to share your habits from your profile page!
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation
        onAddClick={() => navigate('/')}
        user={user}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default Social;