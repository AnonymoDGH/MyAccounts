-- Insert existing users from auth.users into public.users
INSERT INTO public.users (id, email, role)
SELECT 
  id, 
  COALESCE(email, raw_user_meta_data->>'email', 'discord_user_' || substr(id::text, 1, 8)), 
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
