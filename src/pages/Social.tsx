import { useEffect } from "react";
import { useSocialSharing } from "@/hooks/useSocialSharing";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/BottomNavigation";

const Social = () => {
  const { sharedUsers, loading, fetchSharedUsers } = useSocialSharing();

  useEffect(() => {
    fetchSharedUsers();
  }, []);

  const handleUserCardClick = (userId: string) => {
    // Placeholder for future individual user page navigation
    console.log("Clicked user:", userId);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Follow Routiners</h1>
          <p className="text-muted-foreground">Discover and connect with other habit builders</p>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        onAddClick={() => {}}
        user={null}
        onSignOut={() => {}}
      />
    </div>
  );
};

export default Social;