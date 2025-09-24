import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SharedUser } from "@/hooks/useSocialSharing";

interface UserCardProps {
  user: SharedUser;
  onClick?: () => void;
}

export const UserCard = ({ user, onClick }: UserCardProps) => {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card 
      className="p-4 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="h-16 w-16">
        <AvatarImage src={user.avatar_url || ''} />
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
          {getInitials(user.display_name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center">
        <h3 className="font-medium text-foreground">{user.display_name}</h3>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          // Placeholder for follow functionality
        }}
      >
        Follow
      </Button>
    </Card>
  );
};