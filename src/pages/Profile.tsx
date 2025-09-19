import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Edit, Save } from "lucide-react";

const Profile = () => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

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
                R
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Name Field */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Name
          </label>
          <div className="relative">
            <Input
              value="Routiner"
              readOnly={!isEditingName}
              className={`pr-20 ${!isEditingName ? 'border-none bg-transparent focus-visible:ring-0' : ''}`}
              placeholder="Enter your name"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditingName(!isEditingName)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bio Field */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Bio
          </label>
          <div className="relative">
            <Textarea
              readOnly={!isEditingBio}
              className={`min-h-[100px] pr-20 resize-none ${!isEditingBio ? 'border-none bg-transparent focus-visible:ring-0' : ''}`}
              placeholder="how would you describe yourself?"
            />
            <div className="absolute right-2 top-3 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditingBio(!isEditingBio)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Instagram/URL Field */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Instagram
          </label>
          <div className="relative">
            <Input
              readOnly={!isEditingUrl}
              className={`pr-20 ${!isEditingUrl ? 'border-none bg-transparent focus-visible:ring-0' : ''}`}
              placeholder="What's your Instagram handle?"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;