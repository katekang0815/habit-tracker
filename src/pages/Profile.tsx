import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocialSharing } from "@/hooks/useSocialSharing";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Share, Save, X, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";
import { UserFeedbackModal } from "@/components/UserFeedbackModal";

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [initialData, setInitialData] = useState({
    name: "",
    targetRole: "",
    notionUrl: "",
    linkedinUrl: "",
    avatarUrl: ""
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, target_role, notion_url, linkedin, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile:", error);
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
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const isDirty = useMemo(
    () =>
      name !== initialData.name ||
      targetRole !== initialData.targetRole ||
      notionUrl !== initialData.notionUrl ||
      linkedinUrl !== initialData.linkedinUrl ||
      !!previewUrl,
    [name, targetRole, notionUrl, linkedinUrl, previewUrl, initialData]
  );

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }
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

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, selectedFile, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          toast.error("Failed to upload avatar");
          console.error("Upload error:", uploadError);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
        newAvatarUrl = publicUrl;

        if (avatarUrl && avatarUrl.includes("supabase.co/storage")) {
          const oldPath = avatarUrl.split("/storage/v1/object/public/avatars/")[1];
          if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      const saveData = {
        display_name: name,
        target_role: targetRole,
        notion_url: notionUrl,
        linkedin: linkedinUrl,
        avatar_url: newAvatarUrl
      };

      const { error } = await supabase.from("profiles").update(saveData).eq("user_id", user.id);
      if (error) {
        toast.error("Failed to save profile");
        console.error("Error saving profile:", error);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setInitialData({ name, targetRole, notionUrl, linkedinUrl, avatarUrl: newAvatarUrl });
      setPreviewUrl("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error("Failed to save profile");
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(initialData.name);
    setTargetRole(initialData.targetRole);
    setNotionUrl(initialData.notionUrl);
    setLinkedinUrl(initialData.linkedinUrl);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    await handleSaveAll();
  };

  const handleAddClick = () => {
    console.log("Add clicked from profile");
  };

  const handleShare = async () => {
    const result = await toggleSharing();
    if (result?.success && result?.wasSharing === false) {
      navigate("/social", {
        state: { justShared: true, userId: user?.id, timestamp: Date.now() }
      });
    }
  };

  const handleSignOut = async () => {
    try {
      try {
        localStorage.removeItem("habit-tracker-sharing-status");
      } catch {}
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (err) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", err);
    }
  };

  const currentAvatarSrc = previewUrl || avatarUrl || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-background)] pb-20">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header (kept OUTSIDE the new container) */}
        <h1 className="text-2xl font-semibold text-center mb-6 text-foreground">Profile</h1>

        {/* NEW PAGE CONTAINER (light shadow) */}
        <div
          className="
            rounded-2xl border border-border bg-card/70
            shadow-sm ring-1 ring-black/5
            p-10 sm:p-7
          "
        >
          {/* Profile Image + Share */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={currentAvatarSrc} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
                aria-label="Choose profile image"
              />

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

            <div className="w-full max-w-xs">
              {!isSharing ? (
                <TooltipProvider delayDuration={0}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleShare}
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
                  onClick={handleShare}
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

          {/* Fields */}
          <div className="space-y-6">
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

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Notion URL
              </label>
              <Input
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                placeholder="Share your Notion URL to collaborate"
                inputMode="url"
                className="border border-gray-300 hover:border-2 hover:border-green-300 focus:border-2 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                LinkedIn
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

          {/* Actions */}
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCancel} type="button">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button disabled={!isDirty || saving} onClick={handleSave} type="button">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
        {/* END PAGE CONTAINER */}

        {/* Feedback Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setFeedbackOpen(true)}
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>
        </div>
      </div>

      {/* Feedback Modal */}
      <UserFeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* BottomNavigation kept OUTSIDE the container */}
      <BottomNavigation onAddClick={handleAddClick} user={user} onSignOut={handleSignOut} />
    </div>
  );
};

export default Profile;
