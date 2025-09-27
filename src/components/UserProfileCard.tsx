import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";
import { SharedUser } from "@/hooks/useSocialSharing";

interface UserProfileCardProps {
  user: SharedUser;
  onClick?: (userId: string) => void;
}

export const UserProfileCard = ({ user, onClick }: UserProfileCardProps) => {
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    // Generate consistent color based on user ID
    const colors = [
      "bg-primary",
      "bg-secondary", 
      "bg-accent",
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500"
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20"
      onClick={() => onClick?.(user.user_id)}
    >
      <CardContent className="p-6 text-center">
        {/* Avatar */}
        <div className="mb-4 flex justify-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url || ""} alt={user.display_name || ""} />
            <AvatarFallback className={`${getAvatarColor(user.user_id)} text-white text-xl font-semibold`}>
              {getInitials(user.display_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Name */}
        <h3 className="font-semibold text-foreground mb-3 truncate">
          {user.display_name || "Anonymous User"}
        </h3>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Social Media Links */}
        {(user.linkedin || user.notion_url) && (
          <div className="flex justify-center gap-2 mb-4">
            {user.linkedin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(user.linkedin, '_blank');
                }}
                className="w-8 h-8 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </button>
            )}
            {user.notion_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(user.notion_url, '_blank');
                }}
                className="w-8 h-8 rounded bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-colors font-bold text-sm"
                title="Notion"
              >
                N
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Placeholder for Facebook
              }}
              className="w-8 h-8 rounded bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors font-bold text-sm"
              title="Facebook (Coming Soon)"
            >
              F
            </button>
          </div>
        )}

      </CardContent>
    </Card>
  );
};