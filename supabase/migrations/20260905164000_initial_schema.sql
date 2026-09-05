create type problem_status as enum ('todo', 'in_progress', 'done');
create type problem_difficulty as enum ('easy', 'medium', 'hard');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create table problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,

  title text not null,
  description text,
  topic text,              -- e.g. "Arrays", "System Design"
  tags text[],             -- e.g. ["array","two-pointers"]
  source_url text,

  difficulty problem_difficulty not null default 'medium',
  status problem_status not null default 'todo',

  due_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table problems enable row level security;

create policy "Users can read own problems"
  on problems for select
  using ( auth.uid() = user_id );

create policy "Users can insert own problems"
  on problems for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own problems"
  on problems for update
  using ( auth.uid() = user_id );

create policy "Users can delete own problems"
  on problems for delete
  using ( auth.uid() = user_id );

create index problems_user_idx on problems(user_id);
create index problems_status_idx on problems(status);
create index problems_due_date_idx on problems(due_date);

create table solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems(id) on delete cascade,

  language text not null,          -- 'python', 'javascript', 'java', 'pseudo'
  code text not null,
  explanation text,

  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table solutions enable row level security;

create policy "Users can read solutions of own problems"
  on solutions for select
  using (
    exists (
      select 1 from problems p
      where p.id = problem_id and p.user_id = auth.uid()
    )
  );

create policy "Users can modify solutions of own problems"
  on solutions for all
  using (
    exists (
      select 1 from problems p
      where p.id = problem_id and p.user_id = auth.uid()
    )
  );

create index solutions_problem_idx on solutions(problem_id);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references problems(id) on delete cascade,

  phase text not null,           -- 'think', 'pseudo', 'implement'
  duration_min int not null,     -- 3, 5, 20, or 30

  started_at timestamptz not null default now(),
  ended_at timestamptz,

  notes text,

  created_at timestamptz not null default now()
);

alter table study_sessions enable row level security;

create policy "Users can read own sessions"
  on study_sessions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own sessions"
  on study_sessions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own sessions"
  on study_sessions for update
  using ( auth.uid() = user_id );

create index sessions_user_idx on study_sessions(user_id);
create index sessions_problem_idx on study_sessions(problem_id);

create table scratchpads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references problems(id) on delete cascade,

  language text not null,        -- 'python', 'javascript', 'java'
  code text not null default '',
  last_run_output text,

  updated_at timestamptz not null default now()
);

alter table scratchpads enable row level security;

create policy "Users can read own scratchpads"
  on scratchpads for select
  using ( auth.uid() = user_id );

create policy "Users can modify own scratchpads"
  on scratchpads for all
  using ( auth.uid() = user_id );

create unique index scratchpads_problem_user_idx
  on scratchpads(user_id, problem_id);

-- trigger to create a profile automatically when a user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
