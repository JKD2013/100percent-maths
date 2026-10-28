-- ============================================================
// 100Percent — Ultra Design System Schema
// Full gamification, spaced repetition, adaptive learning,
// multi-format questions, and deep teacher analytics.
// ============================================================

-- ------------------------------------------------------------
-- 1. QUESTIONS — Full curriculum bank with metadata
-- ------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_code text not null references public.topics(code),
  expression text not null,          -- What the student sees
  prompt text not null,              -- Instruction text
  answer text not null,              -- Correct answer
  hint text,                         -- Optional hint
  explanation text,                  -- Why this is correct
  difficulty int not null default 1, -- 1-5 scale
  question_type text not null default 'text_input', -- text_input, multiple_choice, drag_drop, graphing, true_false
  options jsonb,                     -- For MCQ: ["a","b","c","d"]
  correct_option int,                -- Index of correct option
  image_url text,                    -- Optional image
  audio_url text,                    -- Optional audio
  prerequisites text[],              -- Topic codes required before this
  tags text[],                       -- Search tags
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. USER PROGRESS — Per-student per-topic mastery
-- ------------------------------------------------------------
create table if not exists public.user_topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_code text not null references public.topics(code),
  level int not null default 1,          -- Crown level 1-5
  xp int not null default 0,             -- Topic-specific XP
  correct_count int not null default 0,
  attempt_count int not null default 0,
  last_practiced_at timestamptz,
  next_review_at timestamptz,            -- Spaced repetition
  is_mastered boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, topic_code)
);

-- ------------------------------------------------------------
-- 3. USER STREAKS — Duolingo-style streak system
-- ------------------------------------------------------------
create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_practiced_date date,
  freeze_count int not null default 0,   -- Streak freezes available
  freeze_used int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ------------------------------------------------------------
-- 4. USER XP & LEVELS — Global progression
-- ------------------------------------------------------------
create table if not exists public.user_progression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_xp int not null default 0,
  level int not null default 1,          -- Overall user level 1-100
  trophies int not null default 0,
  badges jsonb not null default '[]',    -- Earned badge IDs
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ------------------------------------------------------------
-- 5. LEAGUES — Weekly competition groups
-- ------------------------------------------------------------
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- "Bronze League", "Silver League", etc.
  tier int not null default 1,           -- 1-10
  xp_threshold int not null default 0,   -- Min XP to enter
  max_members int not null default 30,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. LEAGUE MEMBERSHIP — Users assigned to leagues
-- ------------------------------------------------------------
create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_earned int not null default 0,      -- XP earned this week
  rank int not null default 0,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

-- ------------------------------------------------------------
-- 7. ATTEMPTS — Every question attempt ever
-- ------------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  time_taken int,                      -- Seconds
  hint_used boolean not null default false,
  attempted_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. INDEXES
-- ------------------------------------------------------------
create index if not exists idx_questions_topic on public.questions(topic_code);
create index if not exists idx_questions_type on public.questions(question_type);
create index if not exists idx_user_topic_progress_user on public.user_topic_progress(user_id);
create index if not exists idx_attempts_user on public.attempts(user_id, attempted_at desc);
create index if not exists idx_attempts_question on public.attempts(question_id);
create index if not exists idx_league_members_league on public.league_members(league_id, xp_earned desc);

-- ------------------------------------------------------------
-- 9. RLS
-- ------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.user_topic_progress enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_progression enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.attempts enable row level security;

create policy questions_select on public.questions for select to authenticated using (true);
create policy user_topic_progress_all on public.user_topic_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_streaks_all on public.user_streaks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_progression_all on public.user_progression for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy leagues_select on public.leagues for select to authenticated using (true);
create policy league_members_all on public.league_members for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy attempts_all on public.attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 10. DEFAULT DATA — Topics, leagues
-- ------------------------------------------------------------
insert into public.topics (code, title) values
  ('394h', 'Negative & Fractional Indices'),
  ('214n', 'Simplifying Algebraic Fractions'),
  ('552p', 'Calculate with Surds'),
  ('443q', 'Surds Operations'),
  ('123n', 'Number Operations'),
  ('456a', 'Algebraic Expressions'),
  ('789g', 'Geometry & Measures'),
  ('012s', 'Statistics & Probability')
on conflict (code) do nothing;

insert into public.leagues (name, tier, xp_threshold, max_members, starts_at, ends_at) values
  ('Bronze League', 1, 0, 30, now(), now() + interval '7 days'),
  ('Silver League', 2, 500, 30, now(), now() + interval '7 days'),
  ('Gold League', 3, 1500, 30, now(), now() + interval '7 days'),
  ('Diamond League', 4, 5000, 30, now(), now() + interval '7 days'),
  ('Champion League', 5, 15000, 30, now(), now() + interval '7 days')
on conflict (name) do nothing;

-- Verify
select 'questions' as tbl, count(*) from public.questions
union all select 'topics', count(*) from public.topics
union all select 'leagues', count(*) from public.leagues;
