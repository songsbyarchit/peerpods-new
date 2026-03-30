-- profiles
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- pods
create table pods (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  tag text not null,
  creator_id uuid references profiles(id),
  expires_at timestamptz not null,
  max_members int default 8,
  created_at timestamptz default now()
);

-- pod_members
create table pod_members (
  pod_id uuid references pods(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (pod_id, user_id)
);

-- messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  pod_id uuid references pods(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table pods enable row level security;
alter table pod_members enable row level security;
alter table messages enable row level security;

-- profiles policies
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- pods policies
create policy "Pods are viewable by everyone"
  on pods for select using (true);
create policy "Authenticated users can create pods"
  on pods for insert with check (auth.uid() is not null);

-- pod_members policies
create policy "Pod members are viewable by everyone"
  on pod_members for select using (true);
create policy "Users can join pods for themselves"
  on pod_members for insert with check (auth.uid() = user_id);
create policy "Users can leave their own pods"
  on pod_members for delete using (auth.uid() = user_id);

-- messages policies
create policy "Messages are viewable by everyone"
  on messages for select using (true);
create policy "Pod members can send messages"
  on messages for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from pod_members
      where pod_id = messages.pod_id
        and user_id = auth.uid()
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
