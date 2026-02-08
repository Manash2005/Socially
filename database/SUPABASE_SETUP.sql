-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES table (Public user data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  campus text,
  batch text,
  branch text,
  bio text,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'https://ui-avatars.com/api/?name=' || replace(coalesce(new.raw_user_meta_data->>'full_name', 'User'), ' ', '+')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- POSTS table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text,
  image_url text,
  visibility text default 'public', -- 'public' or 'campus'
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LIKES table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- COMMENTS table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade, -- For nested comments
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- POLICIES
-- Profiles: Everyone can view, User can update own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts: Everyone can view, Authenticated can create, Owner can delete
create policy "Public posts are viewable by everyone" on public.posts for select using (true);
create policy "Authenticated can create posts" on public.posts for insert with check (auth.role() = 'authenticated');
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Likes: Viewable by everyone, Authenticated can toggle
create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Authenticated can insert likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on public.likes for delete using (auth.uid() = user_id);

-- Comments: Viewable by everyone, Authenticated can comment
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Authenticated can insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- STORAGE BUCKET (for post images)
-- Note: You'll need to create a bucket named 'post-images' in the dashboard manually, 
-- or run this if your Supabase instance allows creating buckets via SQL (usually requires specific extensions)
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict do nothing;

create policy "Anyone can view images" on storage.objects for select using ( bucket_id = 'post-images' );
create policy "Authenticated can upload images" on storage.objects for insert with check ( bucket_id = 'post-images' and auth.role() = 'authenticated' );
