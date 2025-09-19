import { useMemo, useRef, useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";

const MAX_FILE_MB = 5;

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState({ name: "", bio: "", linkedIn: "", avatarUrl: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, bio, linkedin, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          const profileData = {
            name: data.display_name || "",
            bio: data.bio || "",
            linkedIn: data.linkedin || "",
            avatarUrl: data.avatar_url || ""
          };
          
          setName(profileData.name);
          setBio(profileData.bio);
          setLinkedIn(profileData.linkedIn);
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
      bio !== initialData.bio ||
      linkedIn !== initialData.linkedIn ||
      // If a preview exists, user changed avatar locally
      !!previewUrl
    );
  }, [name, bio, linkedIn, previewUrl, initialData]);

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

      // Step 2 & 3: Update profile with new data including avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          bio: bio,
          linkedin: linkedIn,
          avatar_url: newAvatarUrl,
        })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to save profile');
        console.error('Error saving profile:', error);
        return;
      }

      // Step 5: Clear preview state and update initial data
      setAvatarUrl(newAvatarUrl);
      const newInitialData = { name, bio, linkedIn, avatarUrl: newAvatarUrl };
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

  // Handlers for BottomNavigation
  const handleAddClick = () => {
    // You can implement add functionality here if needed
    console.log("Add clicked from profile");
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
        <div className="flex justify-center mb-12">
          <div className="relative">
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
        </div>

        {/* Fields Container */}
        <div className="space-y-8 rounded-xl border border-gray-300 bg-background p-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px] resize-none border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
              placeholder="Say Hello ~"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              LinkedIn
            </label>
            <Input
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
              placeholder="https://www.linkedin.com/in/you"
              inputMode="url"
              className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 mb-8">
          <Button
            className="w-full"
            disabled={!isDirty || saving || loading}
            onClick={handleSaveAll}
            type="button"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
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
