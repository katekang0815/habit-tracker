import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface SharedUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  target_role: string | null;
  linkedin: string | null;
  notion_url: string | null;
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
      const { data } = await supabase
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

  // Fetch all users who have shared their profiles (only with LinkedIn)
  const fetchSharedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_shares')
        .select(`
          user_id,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile data for each user, only include users with LinkedIn
      const userIds = data.map(item => item.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, target_role, linkedin, notion_url')
        .in('user_id', userIds)
        .not('linkedin', 'is', null)
        .neq('linkedin', '');

      if (profilesError) throw profilesError;

      // Only include users who have LinkedIn URLs
      const formattedUsers: SharedUser[] = data
        .map(item => {
          const profile = profilesData?.find(p => p.user_id === item.user_id);
          if (!profile?.linkedin?.trim()) return null;
          
          return {
            user_id: item.user_id,
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
            target_role: profile?.target_role || null,
            linkedin: profile?.linkedin || null,
            notion_url: profile?.notion_url || null,
            shared_at: item.created_at
          };
        })
        .filter((user): user is SharedUser => user !== null);

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

  // Validate profile for sharing
  const validateProfileForSharing = async () => {
    if (!user) return { isValid: false, error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, target_role, linkedin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const missingFields = [];
      if (!data?.display_name?.trim()) missingFields.push("Name");
      if (!data?.target_role?.trim()) missingFields.push("Target Role");
      if (!data?.linkedin?.trim()) missingFields.push("LinkedIn URL");

      if (missingFields.length > 0) {
        const fieldText = missingFields.join(", ");
        return { 
          isValid: false, 
          error: `Please complete your profile first. Missing: ${fieldText}` 
        };
      }

      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: "Failed to validate profile" };
    }
  };

  // Check if user has authorization (shared LinkedIn)
  const checkUserAuthorization = async () => {
    if (!user) {
      console.log('checkUserAuthorization: No user found');
      return false;
    }

    try {
      // First check if user has an active share status
      const { data: shareData, error: shareError } = await supabase
        .from('social_shares')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (shareError) {
        console.error('Error checking social_shares:', shareError);
        return false;
      }

      if (!shareData) {
        console.log('checkUserAuthorization: User is not sharing (no active record)');
        return false;
      }

      // Then check if user has LinkedIn in their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('linkedin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        return false;
      }

      const hasLinkedIn = !!profile?.linkedin?.trim();
      console.log('checkUserAuthorization:', {
        userId: user.id,
        isSharing: !!shareData,
        hasLinkedIn,
        authorized: !!shareData && hasLinkedIn
      });

      return hasLinkedIn;
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  };

  // Toggle sharing status
  const toggleSharing = async () => {
    if (!user) return { success: false, error: "User not authenticated" };

    setLoading(true);
    try {
      if (isSharing) {
        // Unshare - deactivate sharing
        const { error } = await supabase
          .from('social_shares')
          .update({ is_active: false })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unsharing profile:', error);
          throw error;
        }

        setIsSharing(false);
        toast({
          title: "Profile unshared",
          description: "Your profile is no longer visible to other users",
        });
        return { success: true, error: null };
      } else {
        // Validate profile before sharing
        const validation = await validateProfileForSharing();
        if (!validation.isValid) {
          toast({
            title: "Cannot share profile",
            description: validation.error,
            variant: "destructive",
          });
          return { success: false, error: validation.error };
        }

        // Share - create or reactivate sharing with proper conflict resolution
        const { error } = await supabase
          .from('social_shares')
          .upsert({ 
            user_id: user.id,
            is_active: true 
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error sharing profile:', error);
          throw error;
        }

        // Add a small delay to ensure database commit
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refresh sharing status from database to ensure consistency
        await checkSharingStatus();
        
        toast({
          title: "Profile shared!",
          description: "Your profile is now visible to other users",
        });
        return { success: true, error: null, wasSharing: false };
      }
    } catch (error) {
      console.error('Error toggling sharing:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive",
      });
      return { success: false, error: "Failed to update sharing status" };
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
    validateProfileForSharing,
    checkUserAuthorization,
  };
};
