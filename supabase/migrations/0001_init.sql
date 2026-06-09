-- =============================================================================
-- Shrinath Ji Enterprises — Retailer Ordering Platform
-- Migration 0001: schema, enums, indexes, RLS  (PARALLEL / sj_ prefixed)
-- Lives alongside existing tables in the same DB; touches none of them.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Enums (prefixed to avoid collision with existing types) --------------------
do $$ begin create type sj_user_role  as enum ('retailer','warehouse','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type sj_part_brand as enum ('HERO','HONDA','SUZUKI','TVS');  exception when duplicate_object then null; end $$;
do $$ begin create type sj_order_status as enum ('placed','picking','packed','invoiced','closed','cancelled'); exception when duplicate_object then null; end $$;

-- Tables ---------------------------------------------------------------------
create table if not exists sj_distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sj_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  distributor_id uuid not null references sj_distributors(id) on delete cascade,
  role sj_user_role not null default 'retailer',
  shop_name text, contact_name text, phone text, gstin text, city text,
  created_at timestamptz not null default now()
);
create index if not exists sj_idx_profiles_distributor on sj_profiles(distributor_id);

create table if not exists sj_parts (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references sj_distributors(id) on delete cascade,
  part_no text not null,
  description text not null default '',
  brand sj_part_brand not null,
  mrp numeric(12,2) not null default 0,
  moq int not null default 1,
  uuid_last_scanned text,
  bin_location text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists sj_idx_parts_part_no on sj_parts(part_no);
create index if not exists sj_idx_parts_distributor on sj_parts(distributor_id);
create unique index if not exists sj_uq_parts_distributor_partno on sj_parts(distributor_id, part_no);

create table if not exists sj_orders (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references sj_distributors(id) on delete cascade,
  retailer_id uuid not null references sj_profiles(id) on delete cascade,
  status sj_order_status not null default 'placed',
  invoice_no text,
  total_value numeric(12,2) not null default 0,
  placed_at timestamptz not null default now(),
  closed_at timestamptz,
  note text
);
create index if not exists sj_idx_orders_distributor on sj_orders(distributor_id);
create index if not exists sj_idx_orders_retailer on sj_orders(retailer_id);
create index if not exists sj_idx_orders_status on sj_orders(status);

create table if not exists sj_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references sj_orders(id) on delete cascade,
  part_id uuid references sj_parts(id) on delete set null,
  part_no text not null,
  description text not null default '',
  brand text not null default '',
  qty int not null default 1,
  mrp_at_order numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);
create index if not exists sj_idx_order_items_order on sj_order_items(order_id);

create table if not exists sj_scan_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references sj_orders(id) on delete set null,
  part_no text,
  scanned_uuid text not null,
  retailer_id uuid references sj_profiles(id) on delete set null,
  scanned_at timestamptz not null default now()
);
create unique index if not exists sj_uq_scan_log_uuid on sj_scan_log(scanned_uuid);

-- Helper fns (security definer, avoid RLS recursion) -------------------------
create or replace function sj_auth_distributor_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select distributor_id from sj_profiles where id = auth.uid()
$fn$;

create or replace function sj_auth_role()
returns sj_user_role language sql stable security definer set search_path = public as $fn$
  select role from sj_profiles where id = auth.uid()
$fn$;

-- RLS ------------------------------------------------------------------------
alter table sj_distributors enable row level security;
alter table sj_profiles     enable row level security;
alter table sj_parts        enable row level security;
alter table sj_orders       enable row level security;
alter table sj_order_items  enable row level security;
alter table sj_scan_log     enable row level security;

drop policy if exists sj_distributors_select on sj_distributors;
create policy sj_distributors_select on sj_distributors for select to authenticated
  using (id = sj_auth_distributor_id());

drop policy if exists sj_profiles_self_select on sj_profiles;
create policy sj_profiles_self_select on sj_profiles for select to authenticated
  using (id = auth.uid());
drop policy if exists sj_profiles_staff_select on sj_profiles;
create policy sj_profiles_staff_select on sj_profiles for select to authenticated
  using (distributor_id = sj_auth_distributor_id() and sj_auth_role() in ('warehouse','admin'));
drop policy if exists sj_profiles_self_update on sj_profiles;
create policy sj_profiles_self_update on sj_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists sj_parts_select on sj_parts;
create policy sj_parts_select on sj_parts for select to authenticated
  using (distributor_id = sj_auth_distributor_id());
drop policy if exists sj_parts_admin_write on sj_parts;
create policy sj_parts_admin_write on sj_parts for all to authenticated
  using (distributor_id = sj_auth_distributor_id() and sj_auth_role() = 'admin')
  with check (distributor_id = sj_auth_distributor_id() and sj_auth_role() = 'admin');

drop policy if exists sj_orders_retailer_select on sj_orders;
create policy sj_orders_retailer_select on sj_orders for select to authenticated
  using (retailer_id = auth.uid());
drop policy if exists sj_orders_staff_select on sj_orders;
create policy sj_orders_staff_select on sj_orders for select to authenticated
  using (distributor_id = sj_auth_distributor_id() and sj_auth_role() in ('warehouse','admin'));
drop policy if exists sj_orders_retailer_insert on sj_orders;
create policy sj_orders_retailer_insert on sj_orders for insert to authenticated
  with check (retailer_id = auth.uid() and distributor_id = sj_auth_distributor_id());
drop policy if exists sj_orders_retailer_update on sj_orders;
create policy sj_orders_retailer_update on sj_orders for update to authenticated
  using (retailer_id = auth.uid()) with check (retailer_id = auth.uid());
drop policy if exists sj_orders_staff_update on sj_orders;
create policy sj_orders_staff_update on sj_orders for update to authenticated
  using (distributor_id = sj_auth_distributor_id() and sj_auth_role() in ('warehouse','admin'))
  with check (distributor_id = sj_auth_distributor_id() and sj_auth_role() in ('warehouse','admin'));

drop policy if exists sj_order_items_select on sj_order_items;
create policy sj_order_items_select on sj_order_items for select to authenticated
  using (exists (select 1 from sj_orders o where o.id = sj_order_items.order_id
    and (o.retailer_id = auth.uid()
      or (o.distributor_id = sj_auth_distributor_id() and sj_auth_role() in ('warehouse','admin')))));
drop policy if exists sj_order_items_retailer_insert on sj_order_items;
create policy sj_order_items_retailer_insert on sj_order_items for insert to authenticated
  with check (exists (select 1 from sj_orders o where o.id = sj_order_items.order_id and o.retailer_id = auth.uid()));

drop policy if exists sj_scan_log_retailer_select on sj_scan_log;
create policy sj_scan_log_retailer_select on sj_scan_log for select to authenticated
  using (retailer_id = auth.uid());
drop policy if exists sj_scan_log_staff_select on sj_scan_log;
create policy sj_scan_log_staff_select on sj_scan_log for select to authenticated
  using (sj_auth_role() in ('warehouse','admin'));
drop policy if exists sj_scan_log_retailer_insert on sj_scan_log;
create policy sj_scan_log_retailer_insert on sj_scan_log for insert to authenticated
  with check (retailer_id = auth.uid());

-- Auto-closer: set invoice_no -> status closed + closed_at -------------------
create or replace function sj_on_order_invoiced()
returns trigger language plpgsql as $fn$
begin
  if NEW.invoice_no is not null and NEW.invoice_no <> ''
     and (OLD.invoice_no is null or OLD.invoice_no = '') then
    NEW.status := 'closed';
    NEW.closed_at := now();
  end if;
  return NEW;
end $fn$;
drop trigger if exists sj_trg_order_invoiced on sj_orders;
create trigger sj_trg_order_invoiced before update on sj_orders
  for each row execute function sj_on_order_invoiced();

-- Realtime -------------------------------------------------------------------
do $$ begin alter publication supabase_realtime add table sj_orders;      exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table sj_order_items; exception when duplicate_object then null; end $$;
