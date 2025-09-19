import { useMemo, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

const MAX_FILE_MB = 5;

const Profile = () => {
  // Initial values (replace with backend values later)
  const initial = {
    name: "Routiner",
    bio: "",
    linkedIn: "",
    avatarUrl: "", // backend-provided URL if you have one
  };

  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [linkedIn, setLinkedIn] = useState(initial.linkedIn);
  const [avatarUrl, setAvatarUrl] = useState<string>(initial.avatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string>(""); // local preview URL

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // enable/disable Save button
  const isDirty = useMemo(() => {
    return (
      name !== initial.name ||
      bio !== initial.bio ||
      linkedIn !== initial.linkedIn ||
      // If a preview exists, user changed avatar locally
      !!previewUrl
    );
  }, [name, bio, linkedIn, previewUrl]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic guards
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`Image is too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }

    // Revoke old preview URL to avoid memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    // If you want immediate UI swap, set avatar image to preview
    // (we keep avatarUrl for potential backend URL later)
  };

  const handleSaveAll = () => {
    // TODO: replace with real API call to upload avatar & save profile fields
    // If uploading, you'd typically send the File, not the object URL.
    // Here we’re just demonstrating the UI part:
    // - avatar: previewUrl is what we’re showing locally.
    // After your upload returns a CDN URL, setAvatarUrl(cdnUrl) and setPreviewUrl("")
    console.log("Save profile", { name, bio, linkedIn, avatarPreview: previewUrl || avatarUrl });
  };

  // Current image source preference: show preview first, otherwise existing avatarUrl
  const currentAvatarSrc = previewUrl || avatarUrl || "";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-center mb-12 text-foreground">
          profile
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
        <div className="mt-6">
          <Button
            className="w-full"
            disabled={!isDirty}
            onClick={handleSaveAll}
            type="button"
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
