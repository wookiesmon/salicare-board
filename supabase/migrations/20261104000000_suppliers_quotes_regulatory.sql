-- Suppliers, their quotes, and regulatory items. Same access rule as tasks:
-- members of the workspace can read and write; nobody else can see anything.

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  category text not null default 'other'
    check (category in ('oem','raw','cap','tube','carton','design','logistics','other')),
  status text not null default 'candidate'
    check (status in ('candidate','quoting','selected','contracted','dropped')),
  contact_name text check (length(contact_name) <= 200),
  contact text check (length(contact) <= 500),
  moq text check (length(moq) <= 200),
  lead_time text check (length(lead_time) <= 200),
  notes text check (length(notes) <= 10000),
  doc_url text check (doc_url is null or doc_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index suppliers_workspace_idx on public.suppliers(workspace_id);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  item text not null check (length(item) between 1 and 300),
  quantity integer check (quantity is null or quantity > 0),
  unit_price numeric(14, 4) check (unit_price is null or unit_price >= 0),
  tooling_cost numeric(14, 2) check (tooling_cost is null or tooling_cost >= 0),
  currency text not null default 'KRW' check (currency in ('KRW','USD','EUR','CNY')),
  quoted_on date,
  valid_until date,
  notes text check (length(notes) <= 10000),
  doc_url text check (doc_url is null or doc_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotes_supplier_idx on public.quotes(supplier_id);
create index quotes_workspace_idx on public.quotes(workspace_id);

create table public.regulatory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (length(title) between 1 and 300),
  market text not null default 'KR' check (market in ('KR','US','EU','JP','CN','other')),
  kind text not null default 'other'
    check (kind in ('product_approval','trademark','label','test','business_license','other')),
  status text not null default 'preparing'
    check (status in ('preparing','filed','in_review','supplement','approved','rejected')),
  filed_on date,
  expected_on date,
  reference_no text check (length(reference_no) <= 200),
  notes text check (length(notes) <= 10000),
  doc_url text check (doc_url is null or doc_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regulatory_items_workspace_idx on public.regulatory_items(workspace_id);

-- A quote must belong to the same workspace as its supplier.
create function private.quote_matches_supplier() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.suppliers s where s.id = new.supplier_id and s.workspace_id = new.workspace_id
  ) then
    raise exception 'Supplier is not in this workspace';
  end if;
  return new;
end $$;
create trigger quotes_supplier_check before insert or update on public.quotes
  for each row execute function private.quote_matches_supplier();

create trigger suppliers_touch before update on public.suppliers
  for each row execute function public.touch_updated_at();
create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();
create trigger regulatory_items_touch before update on public.regulatory_items
  for each row execute function public.touch_updated_at();

alter table public.suppliers enable row level security;
alter table public.quotes enable row level security;
alter table public.regulatory_items enable row level security;

create policy "members read suppliers" on public.suppliers
  for select to authenticated using (private.is_member(workspace_id));
create policy "members add suppliers" on public.suppliers
  for insert to authenticated with check (private.is_member(workspace_id));
create policy "members edit suppliers" on public.suppliers
  for update to authenticated using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy "members delete suppliers" on public.suppliers
  for delete to authenticated using (private.is_member(workspace_id));

create policy "members read quotes" on public.quotes
  for select to authenticated using (private.is_member(workspace_id));
create policy "members add quotes" on public.quotes
  for insert to authenticated with check (private.is_member(workspace_id));
create policy "members edit quotes" on public.quotes
  for update to authenticated using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy "members delete quotes" on public.quotes
  for delete to authenticated using (private.is_member(workspace_id));

create policy "members read regulatory items" on public.regulatory_items
  for select to authenticated using (private.is_member(workspace_id));
create policy "members add regulatory items" on public.regulatory_items
  for insert to authenticated with check (private.is_member(workspace_id));
create policy "members edit regulatory items" on public.regulatory_items
  for update to authenticated using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy "members delete regulatory items" on public.regulatory_items
  for delete to authenticated using (private.is_member(workspace_id));
