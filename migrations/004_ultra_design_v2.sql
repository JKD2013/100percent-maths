-- ============================================================
// 100Percent — Ultra Design System v2
// Question bank builder, leaderboards, badges, spaced repetition
// ============================================================

-- ------------------------------------------------------------
-- 1. QUESTION BANK — Teacher-created questions
-- ------------------------------------------------------------
create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  expression text not null,
  prompt text not null,
  answer text not null,
  hint text,
  explanation text,
  difficulty int not null default 1 check (difficulty between 1 and 5),
  question_type text not null default 'text_input' check (question_type in ('text_input', 'multiple_choice', 'true_false', 'drag_drop')),
  options jsonb,
  correct_option int,
  topic_code text not null references public.topics(code),
  created_by uuid not null references auth.users(id),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. BADGES — Achievement system
-- ------------------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,           -- emoji
  criteria_type text not null,  -- 'streak', 'xp', 'questions', 'perfect'
  criteria_value int not null,  -- threshold to unlock
  color text not null default '#d4af37',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. USER BADGES EARNED
-- ------------------------------------------------------------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ------------------------------------------------------------
-- 4. DAILY STATS — For streak tracking analytics
-- ------------------------------------------------------------
create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_date date not null,
  questions_answered int not null default 0,
  correct_count int not null default 0,
  xp_earned int not null default 0,
  unique (user_id, practice_date)
);

-- ------------------------------------------------------------
-- 5. INDEXES
-- ------------------------------------------------------------
create index if not exists idx_question_bank_topic on public.question_bank(topic_code);
create index if not exists idx_question_bank_creator on public.question_bank(created_by);
create index if not exists idx_user_badges_user on public.user_badges(user_id);
create index if not exists idx_daily_stats_user_date on public.daily_stats(user_id, practice_date);

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
alter table public.question_bank enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.daily_stats enable row level security;

create policy question_bank_select on public.question_bank for select to authenticated using (true);
create policy question_bank_manage on public.question_bank for all to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy badges_select on public.badges for select to authenticated using (true);
create policy user_badges_select on public.user_badges for select to authenticated using (auth.uid() = user_id);
create policy user_badges_insert on public.user_badges for insert to authenticated with check (auth.uid() = user_id);
create policy daily_stats_all on public.daily_stats for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. SEED BADGES
-- ------------------------------------------------------------
insert into public.badges (name, description, icon, criteria_type, criteria_value, color) values
  ('First Steps', 'Answer your first question', '👶', 'questions', 1, '#d4af37'),
  ('Streak Starter', '3-day streak', '🔥', 'streak', 3, '#f59e0b'),
  ('Streak Master', '7-day streak', '🔥', 'streak', 7, '#f59e0b'),
  ('Perfect Ten', '10 correct in a row', '💎', 'perfect', 10, '#10b981'),
  ('Centurion', '100 questions answered', '🏆', 'questions', 100, '#d4af37'),
  ('XP Hunter', '1000 XP earned', '💎', 'xp', 1000, '#f59e0b'),
  ('Math Master', 'Complete all topics', '👑', 'questions', 500, '#d4af37')
on conflict (name) do nothing;

-- Verify
select 'badges' as tbl, count(*) from public.badges
union all select 'question_bank', count(*) from public.question_bank;
