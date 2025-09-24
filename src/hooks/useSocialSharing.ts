import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

export interface SocialShare {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  linkedin: string | null;
  is_active: boolean;
}

export const useSocialSharing = (user: User | null) => {
  const [shareStatus, setShareStatus] = useState<SocialShare | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShareStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('social_shares')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching share status:', error);
        return;
      }

      setShareStatus(data);
    } catch (error) {
      console.error('Error fetching share status:', error);
    }
  };

  const fetchSharedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_shares')
        .select(`
          user_id,
          is_active,
          profiles!fk_social_shares_profiles (
            display_name,
            avatar_url,
            bio,
            linkedin
          )
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching shared users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch shared users",
          variant: "destructive",
        });
        return;
      }

      const mappedUsers: SharedUser[] = (data || []).map((item: any) => ({
        user_id: item.user_id,
        display_name: item.profiles?.display_name || 'Anonymous',
        avatar_url: item.profiles?.avatar_url,
        bio: item.profiles?.bio,
        linkedin: item.profiles?.linkedin,
        is_active: item.is_active,
      }));

      setSharedUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shared users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSharing = async () => {
    if (!user) return;

    try {
      if (shareStatus?.is_active) {
        // Unshare - deactivate
        const { error } = await supabase
          .from('social_shares')
          .update({ is_active: false })
          .eq('user_id', user.id);

        if (error) throw error;

        setShareStatus({ ...shareStatus, is_active: false });
        
        // Remove user from shared users list
        setSharedUsers(prev => prev.filter(u => u.user_id !== user.id));
        
        toast({
          title: "Success",
          description: "Your profile has been unshared",
        });
      } else {
        // Share - create or activate
        const { data, error } = await supabase
          .from('social_shares')
          .upsert({ 
            user_id: user.id, 
            is_active: true 
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (error) throw error;

        setShareStatus(data);
        
        // Fetch user profile and add to shared users list immediately
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio, linkedin')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const newSharedUser: SharedUser = {
            user_id: user.id,
            display_name: profile.display_name || 'Anonymous',
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            linkedin: profile.linkedin,
            is_active: true,
          };
          
          // Add to the beginning of the list if not already present
          setSharedUsers(prev => {
            const exists = prev.some(u => u.user_id === user.id);
            if (!exists) {
              return [newSharedUser, ...prev];
            }
            return prev;
          });
        }
        
        toast({
          title: "Success",
          description: "Your profile has been shared to the social page",
        });
      }
    } catch (error) {
      console.error('Error toggling sharing:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchShareStatus();
    }
  }, [user]);

  return {
    shareStatus,
    sharedUsers,
    loading,
    toggleSharing,
    fetchSharedUsers,
    isShared: shareStatus?.is_active || false,
  };
};