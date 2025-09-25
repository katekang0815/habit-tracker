import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

// Temporary workaround for type safety until Supabase types are regenerated
const socialSharesQuery = (supabase as any);

export interface SharedUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin: string | null;
  shared_at: string;
}

export const useSocialSharing = () => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if current user is sharing
  const checkSharingStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await socialSharesQuery
        .from('social_shares')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      setIsSharing(!!data);
    } catch (error) {
      // User hasn't shared yet, which is fine
      setIsSharing(false);
    }
  };

  // Fetch all users who have shared their profiles
  const fetchSharedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await socialSharesQuery
        .from('social_shares')
        .select(`
          user_id,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile data for each user
      const userIds = data.map(item => item.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio, linkedin')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const formattedUsers: SharedUser[] = data.map(item => {
        const profile = profilesData?.find(p => p.user_id === item.user_id);
        return {
          user_id: item.user_id,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
          linkedin: profile?.linkedin || null,
          shared_at: item.created_at
        };
      });

      setSharedUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      toast({
        title: "Error",
        description: "Failed to load shared profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle sharing status
  const toggleSharing = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (isSharing) {
        // Unshare - deactivate sharing
        const { error } = await socialSharesQuery
          .from('social_shares')
          .update({ is_active: false })
          .eq('user_id', user.id);

        if (error) throw error;

        setIsSharing(false);
        toast({
          title: "Profile unshared",
          description: "Your profile is no longer visible to other users",
        });
      } else {
        // Share - create or reactivate sharing
        const { error } = await socialSharesQuery
          .from('social_shares')
          .upsert({ 
            user_id: user.id,
            is_active: true 
          });

        if (error) throw error;

        setIsSharing(true);
        toast({
          title: "Profile shared!",
          description: "Your profile is now visible to other users",
        });
      }
    } catch (error) {
      console.error('Error toggling sharing:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkSharingStatus();
    }
  }, [user]);

  return {
    isSharing,
    sharedUsers,
    loading,
    toggleSharing,
    fetchSharedUsers,
  };
};