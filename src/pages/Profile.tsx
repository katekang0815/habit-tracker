import { useState, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

const Profile = () => {
  // Initial values (could come from your backend later)
  const initial = {
    name: "Routiner",
    bio: "",
    linkedIn: "",
  };

  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [linkedIn, setLinkedIn] = useState(initial.linkedIn);

  // Simple dirty check to enable/disable Save button
  const isDirty = useMemo(() => {
    return name !== initial.name || bio !== initial.bio || linkedIn !== initial.linkedIn;
  }, [name, bio, linkedIn]);

  const handleSaveAll = () => {
    // TODO: replace with real API call
    const payload = { name, bio, linkedIn };
    console.log("Save profile", payload);
    // Optionally show a toast
  };

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
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2"
              type="button"
              onClick={() => console.log("Change avatar")}
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
              className="border border-gray-300 hover:border-2 hover:border-green-500  focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-white transition-colors"
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
              className="min-h-[100px] resize-none border border-gray-300 hover:border-2 hover:border-green-500 focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-white transition-colors"
              placeholder="How would you describe yourself?"
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
              className="border border-gray-300 hover:border-2 hover:border-green-500 focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-white transition-colors"
            />
          </div>
        </div>

        {/* Save Button (outside the container) */}
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
