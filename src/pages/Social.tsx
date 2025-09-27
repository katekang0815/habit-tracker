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
  const { sharedUsers, loading, fetchSharedUsers } = useSocialSharing();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }
    fetchSharedUsers();
  }, [user, authLoading, navigate]);

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

  if (authLoading) {
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