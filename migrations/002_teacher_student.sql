-- ============================================================
-- 100Percent — Teacher/Student Schema
-- Groups, Assignments, Assignment Questions, Student Progress
-- ============================================================

-- Groups (classes) created by teachers
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Students in groups
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, student_id)
);

-- Assignments (homework set by teachers for groups)
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  due_date date,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now()
);

-- Questions assigned within each assignment
create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null,
  unique (assignment_id, question_id)
);

-- Student progress on assignment questions
create table if not exists public.student_assignment_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  attempted_at timestamptz not null default now(),
  unique (assignment_id, student_id, question_id)
);

-- Indexes
create index if not exists idx_groups_teacher on public.groups(teacher_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_student on public.group_members(student_id);
create index if not exists idx_assignments_teacher on public.assignments(teacher_id);
create index if not exists idx_assignments_group on public.assignments(group_id);
create index if not exists idx_assignment_questions_assignment on public.assignment_questions(assignment_id);
create index if not exists idx_student_progress_assignment on public.student_assignment_progress(assignment_id, student_id);
create index if not exists idx_student_progress_student on public.student_assignment_progress(student_id);

-- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.student_assignment_progress enable row level security;

-- Policies
create policy "groups_teacher_manage" on public.groups for all to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "groups_student_view" on public.groups for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = groups.id and gm.student_id = auth.uid())
);

create policy "group_members_teacher_manage" on public.group_members for all to authenticated using (
  auth.uid() = (select teacher_id from public.groups where id = group_id)
) with check (
  auth.uid() = (select teacher_id from public.groups where id = group_id)
);
create policy "group_members_view" on public.group_members for select to authenticated using (
  student_id = auth.uid() or
  auth.uid() = (select teacher_id from public.groups where id = group_id)
);

create policy "assignments_teacher_manage" on public.assignments for all to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "assignments_student_view" on public.assignments for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = assignments.group_id and gm.student_id = auth.uid())
);

create policy "assignment_questions_teacher_manage" on public.assignment_questions for all to authenticated using (
  auth.uid() = (select teacher_id from public.assignments where id = assignment_id)
);
create policy "assignment_questions_student_view" on public.assignment_questions for select to authenticated using (
  exists (
    select 1 from public.assignments a
    join public.group_members gm on gm.group_id = a.group_id
    where a.id = assignment_questions.assignment_id and gm.student_id = auth.uid()
  )
);

create policy "student_progress_student_manage" on public.student_assignment_progress for all to authenticated using (
  student_id = auth.uid()
) with check (student_id = auth.uid());
create policy "student_progress_teacher_view" on public.student_assignment_progress for select to authenticated using (
  auth.uid() = (select teacher_id from public.assignments where id = assignment_id)
);

-- Update existing profiles to ensure role column has correct values
update public.profiles set role = 'student' where role is null or role = '';

-- Function to set role on signup
create or replace function public.set_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = coalesce(new.raw_user_meta_data->>'role', 'student')
  where id = new.id;
  return new;
end;
$$;

-- Ensure triggers exist
drop trigger if exists on_auth_user_set_role on auth.users;
create trigger on_auth_user_set_role
  after insert on auth.users
  for each row execute function public.set_user_role();

-- Add role column to profiles if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text not null default 'student';
  end if;
end $$;

-- Verify schema
select 'groups' as tbl, count(*) from public.groups
union all select 'group_members', count(*) from public.group_members
union all select 'assignments', count(*) from public.assignments
union all select 'assignment_questions', count(*) from public.assignment_questions
union all select 'student_assignment_progress', count(*) from public.student_assignment_progress;
