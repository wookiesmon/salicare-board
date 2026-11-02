-- A workspace is one product launch. Members can see and edit everything in it.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  launch_date date not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (length(title) between 1 and 500),
  phase_id text not null check (phase_id in ('p0','p1','p2','p3','p4','p5','p6','p7','p8')),
  status text not null default 'todo' check (status in ('todo','doing','waiting','done')),
  priority text not null default 'p2' check (priority in ('p1','p2','p3')),
  due date not null,
  notes text check (length(notes) <= 10000),
  doc_url text check (doc_url is null or doc_url ~* '^https?://'),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_workspace_idx on public.tasks(workspace_id);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Membership checks live outside the API schema and run as definer so
-- policies on workspace_members don't recurse.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = (select auth.uid())
  );
$$;

create function private.is_owner(ws uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Creates a workspace and makes the caller its owner in one step.
create function public.create_workspace(ws_name text, ws_launch_date date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  insert into public.workspaces (name, launch_date, created_by)
    values (ws_name, ws_launch_date, auth.uid())
    returning id into new_id;
  insert into public.workspace_members (workspace_id, user_id, role)
    values (new_id, auth.uid(), 'owner');
  return new_id;
end $$;

revoke execute on function private.is_member(uuid) from public, anon;
revoke execute on function private.is_owner(uuid) from public, anon;
revoke execute on function public.create_workspace(text, date) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.is_owner(uuid) to authenticated;
grant execute on function public.create_workspace(text, date) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.tasks enable row level security;

-- Workspaces: members read, owners update/delete. Creation goes through create_workspace().
create policy "members read workspace" on public.workspaces
  for select to authenticated using (private.is_member(id));
create policy "owners update workspace" on public.workspaces
  for update to authenticated using (private.is_owner(id)) with check (private.is_owner(id));
create policy "owners delete workspace" on public.workspaces
  for delete to authenticated using (private.is_owner(id));

-- Members: anyone in the workspace can see who else is in it; owners manage membership.
create policy "members read membership" on public.workspace_members
  for select to authenticated using (private.is_member(workspace_id));
create policy "owners add members" on public.workspace_members
  for insert to authenticated with check (private.is_owner(workspace_id));
create policy "owners remove members" on public.workspace_members
  for delete to authenticated using (private.is_owner(workspace_id));

-- Tasks: full access for workspace members only.
create policy "members read tasks" on public.tasks
  for select to authenticated using (private.is_member(workspace_id));
create policy "members add tasks" on public.tasks
  for insert to authenticated with check (private.is_member(workspace_id));
create policy "members edit tasks" on public.tasks
  for update to authenticated using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy "members delete tasks" on public.tasks
  for delete to authenticated using (private.is_member(workspace_id));
