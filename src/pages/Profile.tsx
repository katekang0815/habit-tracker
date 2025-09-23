import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Edit2, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";

const MAX_FILE_MB = 5;

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [url, setUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState({ name: "", bio: "", url: "", avatarUrl: "" });
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalBio, setModalBio] = useState("");
  const [modalUrl, setModalUrl] = useState("");

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
            url: data.linkedin || "",
            avatarUrl: data.avatar_url || ""
          };
          
          setName(profileData.name);
          setBio(profileData.bio);
          setUrl(profileData.url);
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
    if (isModalOpen) {
      return (
        modalName !== name ||
        modalBio !== bio ||
        modalUrl !== url
      );
    }
    return (
      name !== initialData.name ||
      bio !== initialData.bio ||
      url !== initialData.url ||
      // If a preview exists, user changed avatar locally
      !!previewUrl
    );
  }, [name, bio, url, previewUrl, initialData, isModalOpen, modalName, modalBio, modalUrl]);

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

      // Use modal values if modal is open, otherwise use current values
      const saveData = isModalOpen ? {
        display_name: modalName,
        bio: modalBio,
        linkedin: modalUrl,
        avatar_url: newAvatarUrl,
      } : {
        display_name: name,
        bio: bio,
        linkedin: url,
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

      // Step 5: Update state and close modal if open
      if (isModalOpen) {
        setName(modalName);
        setBio(modalBio);
        setUrl(modalUrl);
        setIsModalOpen(false);
      }
      
      setAvatarUrl(newAvatarUrl);
      const newInitialData = { 
        name: isModalOpen ? modalName : name, 
        bio: isModalOpen ? modalBio : bio, 
        url: isModalOpen ? modalUrl : url, 
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

  const handleEditClick = () => {
    setModalName(name);
    setModalBio(bio);
    setModalUrl(url);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalName(name);
    setModalBio(bio);
    setModalUrl(url);
    setIsModalOpen(false);
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

        {/* Fields Container - Read Only Display */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Name
            </label>
            <div className="bg-accent/50 rounded-lg px-4 py-3 border border-accent transition-all duration-200">
              <p className="text-foreground font-medium">
                {name || (
                  <span className="text-muted-foreground italic">Introduce your name!</span>
                )}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Bio
            </label>
            <div className="bg-accent/50 rounded-lg px-4 py-3 border border-accent min-h-[100px] transition-all duration-200">
              <p className="text-foreground leading-relaxed">
                {bio || (
                  <span className="text-muted-foreground italic">Say Hello ~ </span>
                )}
              </p>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              URL
            </label>
            <div className="bg-accent/50 rounded-lg px-4 py-3 border border-accent transition-all duration-200">
              {url ? (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-primary-glow transition-colors duration-200 font-medium break-all underline decoration-primary/30 hover:decoration-primary underline-offset-2"
                >
                  {url}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Share your public URL</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 mb-8 grid grid-cols-2 gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Share functionality - could copy profile URL to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    // You can add a toast notification here if needed
                  }}
                  type="button"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">❤️</span>
                  <p>Share your habit list to your Social page</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={handleEditClick}
            type="button"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Name
                </label>
                <Input
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
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
                  value={modalBio}
                  onChange={(e) => setModalBio(e.target.value)}
                  className="min-h-[100px] resize-none border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
                  placeholder="Say Hello ~"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  URL
                </label>
                <Input
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                  placeholder="Enter your URL"
                  inputMode="url"
                  className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleModalCancel}
                type="button"
              >
                Cancel
              </Button>
              <Button
                disabled={!isDirty || saving}
                onClick={handleSaveAll}
                type="button"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
