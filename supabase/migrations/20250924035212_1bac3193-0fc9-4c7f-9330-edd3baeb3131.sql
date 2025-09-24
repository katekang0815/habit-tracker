-- Create social_shares table to track which users have shared their profile and stats
CREATE TABLE public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for social_shares
CREATE POLICY "Users can create their own social share" 
ON public.social_shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social share" 
ON public.social_shares 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own social share" 
ON public.social_shares 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social share" 
ON public.social_shares 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy to allow viewing active social shares by all authenticated users
CREATE POLICY "Users can view active social shares" 
ON public.social_shares 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_shares_updated_at
BEFORE UPDATE ON public.social_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();