import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocialSharing } from "@/hooks/useSocialSharing";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Edit2, Share, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";

const MAX_FILE_MB = 5;

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSharing, toggleSharing, loading: shareLoading } = useSocialSharing();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState({ name: "", targetRole: "", notionUrl: "", linkedinUrl: "", avatarUrl: "" });
  

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Redirect to home page when user is definitely not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, target_role, notion_url, linkedin, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          const profileData = {
            name: data.display_name || "",
            targetRole: data.target_role || "",
            notionUrl: data.notion_url || "",
            linkedinUrl: data.linkedin || "",
            avatarUrl: data.avatar_url || ""
          };
          
          setName(profileData.name);
          setTargetRole(profileData.targetRole);
          setNotionUrl(profileData.notionUrl);
          setLinkedinUrl(profileData.linkedinUrl);
          setAvatarUrl(profileData.avatarUrl);
          setInitialData(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // enable/disable Save button
  const isDirty = useMemo(() => {
    return (
      name !== initialData.name ||
      targetRole !== initialData.targetRole ||
      notionUrl !== initialData.notionUrl ||
      linkedinUrl !== initialData.linkedinUrl ||
      // If a preview exists, user changed avatar locally
      !!previewUrl
    );
  }, [name, targetRole, notionUrl, linkedinUrl, previewUrl, initialData]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic guards
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }

    // Revoke old preview URL to avoid memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Step 1: Upload new avatar if one was selected
      if (selectedFile) {
        // Generate unique filename
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          toast.error('Failed to upload avatar');
          console.error('Upload error:', uploadError);
          return;
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);

        newAvatarUrl = publicUrl;

        // Step 4: Delete old avatar file if it exists
        if (avatarUrl && avatarUrl.includes('supabase.co/storage')) {
          const oldPath = avatarUrl.split('/storage/v1/object/public/avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath]);
          }
        }
      }

      // Use current values
      const saveData = {
        display_name: name,
        target_role: targetRole,
        notion_url: notionUrl,
        linkedin: linkedinUrl,
        avatar_url: newAvatarUrl,
      };

      // Step 2 & 3: Update profile with new data including avatar URL
      const { error } = await supabase
        .from('profiles')
        .update(saveData)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to save profile');
        console.error('Error saving profile:', error);
        return;
      }

      // Step 5: Update state and exit editing mode
      setAvatarUrl(newAvatarUrl);
      const newInitialData = { 
        name, 
        targetRole, 
        notionUrl, 
        linkedinUrl,
        avatarUrl: newAvatarUrl 
      };
      setInitialData(newInitialData);
      setPreviewUrl("");
      setSelectedFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Profile saved successfully');
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };


  const handleCancel = () => {
    setName(initialData.name);
    setTargetRole(initialData.targetRole);
    setNotionUrl(initialData.notionUrl);
    setLinkedinUrl(initialData.linkedinUrl);
    
    // Reset avatar changes
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    await handleSaveAll();
  };

  // Handlers for BottomNavigation
  const handleAddClick = () => {
    // You can implement add functionality here if needed
    console.log("Add clicked from profile");
  };

  const handleShare = async () => {
    const wasSharing = isSharing;
    const result = await toggleSharing();
    
    // Navigate to social page only if user just enabled sharing successfully
    if (!wasSharing && result?.success) {
      navigate('/social');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  // Current image source preference: show preview first, otherwise existing avatarUrl
  const currentAvatarSrc = previewUrl || avatarUrl || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-center mb-12 text-foreground">
          Profile
        </h1>

        {/* Profile Image */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentAvatarSrc} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
              aria-label="Choose profile image"
            />

            {/* Trigger button */}
            <Button
              size="icon"
              variant="outline"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2"
              type="button"
              onClick={openFilePicker}
              aria-label="Change avatar"
              title="Change avatar"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {/* Share Button - moved below avatar */}
          <div className="w-full max-w-xs">
            {!isSharing ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await handleShare();
                      }}
                      disabled={shareLoading}
                      type="button"
                      className="w-full"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      {shareLoading ? "Updating..." : "Share"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">❤️</span>
                      <p>Share your habit list to your Social page</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  await handleShare();
                }}
                disabled={shareLoading}
                type="button"
                className="w-full"
              >
                <Share className="w-4 h-4 mr-2" />
                {shareLoading ? "Updating..." : "Unshare"}
              </Button>
            )}
          </div>
        </div>

        {/* Fields Container - Editable/Display */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Target Role
            </label>
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Enter your target role"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>

          {/* Notion URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              NOTION URL
            </label>
            <Input
              value={notionUrl}
              onChange={(e) => setNotionUrl(e.target.value)}
              placeholder="Share your Notion URL to collaborate"
              inputMode="url"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              LINKEDIN
            </label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="Share your LinkedIn URL to connect"
              inputMode="url"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              type="button"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              disabled={!isDirty || saving}
              onClick={handleSave}
              type="button"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

      </div>

      <BottomNavigation 
        onAddClick={handleAddClick}
        user={user}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default Profile;
