-- Kostlyfe: skema awal manajemen kontrakan
-- Semua nominal uang dalam Rupiah (bigint, tanpa desimal).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.app_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date;
$$;

create type public.lease_status as enum ('active', 'ended');
create type public.payment_method as enum ('cash', 'transfer');
create type public.expense_category as enum ('listrik', 'air', 'pajak', 'perbaikan', 'kebersihan', 'lainnya');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  bank_name text,
  bank_account text,
  bank_holder text,
  receipt_prefix text not null default 'KW',
  wa_template text not null default
    'Halo {nama}, ini pengingat sewa {kontrakan} untuk bulan {bulan} sebesar {nominal}, jatuh tempo {jatuh_tempo}. Terima kasih 🙏',
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  address text,
  default_rent bigint not null default 0 check (default_rent >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  nik text,
  emergency_contact text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  start_date date not null,
  end_date date,
  monthly_rent bigint not null check (monthly_rent > 0),
  due_day smallint not null default 1 check (due_day between 1 and 28),
  deposit bigint not null default 0 check (deposit >= 0),
  status public.lease_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (status = 'active' or end_date is not null)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  lease_id uuid not null references public.leases (id) on delete cascade,
  period_month date not null check (extract(day from period_month) = 1),
  base_amount bigint not null check (base_amount >= 0),
  due_date date not null,
  extended_due_date date,
  extension_note text,
  created_at timestamptz not null default now(),
  unique (lease_id, period_month)
);

create sequence public.receipt_seq;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  lease_id uuid not null references public.leases (id) on delete cascade,
  paid_at date not null,
  amount bigint not null check (amount > 0),
  method public.payment_method not null default 'transfer',
  proof_path text,
  receipt_no text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount bigint not null check (amount > 0),
  unique (payment_id, invoice_id)
);

create table public.renovations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  lease_id uuid references public.leases (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  description text,
  cost bigint not null check (cost > 0),
  renovation_date date not null,
  start_month date not null check (extract(day from start_month) = 1),
  installments smallint not null default 1 check (installments between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.invoice_adjustments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  renovation_id uuid references public.renovations (id) on delete cascade,
  amount bigint not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  category public.expense_category not null default 'lainnya',
  amount bigint not null check (amount > 0),
  expense_date date not null,
  notes text,
  receipt_path text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (FK + query paths)
-- ---------------------------------------------------------------------------
create unique index leases_one_active_per_property on public.leases (property_id) where status = 'active';
create index leases_owner_idx on public.leases (owner_id);
create index leases_tenant_idx on public.leases (tenant_id);
create index properties_owner_idx on public.properties (owner_id);
create index tenants_owner_idx on public.tenants (owner_id);
create index invoices_owner_period_idx on public.invoices (owner_id, period_month);
create index payments_lease_idx on public.payments (lease_id, paid_at);
create index payments_owner_paid_idx on public.payments (owner_id, paid_at);
create index payment_allocations_invoice_idx on public.payment_allocations (invoice_id);
create index renovations_property_idx on public.renovations (property_id);
create index renovations_lease_idx on public.renovations (lease_id);
create index invoice_adjustments_invoice_idx on public.invoice_adjustments (invoice_id);
create index invoice_adjustments_renovation_idx on public.invoice_adjustments (renovation_id);
create index expenses_owner_date_idx on public.expenses (owner_id, expense_date);
create index expenses_property_idx on public.expenses (property_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: setiap baris milik owner_id
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['properties', 'tenants', 'leases', 'invoices', 'payments',
                           'payment_allocations', 'renovations', 'invoice_adjustments', 'expenses']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      t || '_own', t);
  end loop;
end $$;

revoke all on all tables in schema public from anon;
grant usage on sequence public.receipt_seq to authenticated;

-- Profil otomatis untuk user baru
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
create view public.invoice_balances with (security_invoker = true) as
select
  i.id,
  i.owner_id,
  i.lease_id,
  i.period_month,
  i.base_amount,
  i.due_date,
  i.extended_due_date,
  i.extension_note,
  l.property_id,
  l.tenant_id,
  p.name as property_name,
  t.name as tenant_name,
  t.phone as tenant_phone,
  calc.discount,
  calc.amount_due,
  calc.paid,
  calc.amount_due - calc.paid as balance,
  coalesce(i.extended_due_date, i.due_date) as effective_due_date,
  case
    when calc.amount_due - calc.paid <= 0 then 'lunas'
    when coalesce(i.extended_due_date, i.due_date) < public.app_today() then 'telat'
    when i.extended_due_date is not null then 'diperpanjang'
    when calc.paid > 0 then 'sebagian'
    else 'belum_bayar'
  end as status
from public.invoices i
join public.leases l on l.id = i.lease_id
join public.properties p on p.id = l.property_id
join public.tenants t on t.id = l.tenant_id
cross join lateral (
  select
    coalesce(adj.total, 0) as discount,
    greatest(i.base_amount - coalesce(adj.total, 0), 0) as amount_due,
    coalesce(al.total, 0) as paid
  from (select sum(a.amount)::bigint as total from public.invoice_adjustments a where a.invoice_id = i.id) adj,
       (select sum(pa.amount)::bigint as total from public.payment_allocations pa where pa.invoice_id = i.id) al
) calc;

create view public.lease_summaries with (security_invoker = true) as
select
  l.*,
  p.name as property_name,
  t.name as tenant_name,
  t.phone as tenant_phone,
  coalesce(agg.outstanding, 0)::bigint as outstanding,
  coalesce(agg.overdue_count, 0)::int as overdue_count,
  agg.first_unpaid_month,
  agg.last_invoice_month,
  (coalesce(pay.total, 0) - coalesce(alloc.total, 0))::bigint as credit
from public.leases l
join public.properties p on p.id = l.property_id
join public.tenants t on t.id = l.tenant_id
left join lateral (
  select
    sum(ib.balance) filter (where ib.balance > 0 and ib.period_month <= date_trunc('month', public.app_today())) as outstanding,
    count(*) filter (where ib.status = 'telat') as overdue_count,
    min(ib.period_month) filter (where ib.balance > 0) as first_unpaid_month,
    max(ib.period_month) as last_invoice_month
  from public.invoice_balances ib
  where ib.lease_id = l.id
) agg on true
left join lateral (select sum(amount) as total from public.payments where lease_id = l.id) pay on true
left join lateral (
  select sum(pa.amount) as total
  from public.payment_allocations pa
  join public.payments py on py.id = pa.payment_id
  where py.lease_id = l.id
) alloc on true;

-- ---------------------------------------------------------------------------
-- Functions (security invoker: RLS tetap berlaku)
-- ---------------------------------------------------------------------------

-- Buat tagihan bulanan yang belum ada, dari awal sewa s/d p_until (dibatasi akhir sewa).
create or replace function public.ensure_invoices(p_lease_id uuid, p_until date default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  l public.leases%rowtype;
  m date;
  last_m date;
  n integer := 0;
begin
  select * into l from public.leases where id = p_lease_id;
  if not found then
    raise exception 'Sewa tidak ditemukan';
  end if;

  last_m := date_trunc('month', coalesce(p_until, public.app_today()))::date;
  if l.end_date is not null then
    last_m := least(last_m, date_trunc('month', l.end_date)::date);
  end if;

  m := date_trunc('month', l.start_date)::date;
  while m <= last_m loop
    insert into public.invoices (owner_id, lease_id, period_month, base_amount, due_date)
    values (l.owner_id, l.id, m, l.monthly_rent, m + (l.due_day - 1))
    on conflict (lease_id, period_month) do nothing;
    if found then
      n := n + 1;
    end if;
    m := (m + interval '1 month')::date;
  end loop;

  return n;
end;
$$;

-- Tagihan s/d bulan ini untuk semua sewa aktif milik user.
create or replace function public.ensure_all_invoices()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  r record;
  n integer := 0;
begin
  for r in select id from public.leases where status = 'active' loop
    n := n + public.ensure_invoices(r.id, null);
  end loop;
  return n;
end;
$$;

-- Hitung ulang alokasi semua pembayaran sebuah sewa (FIFO, tagihan tertua dulu).
-- Tagihan bulan depan dibuat sesuai kebutuhan (bayar di muka). Kelebihan disimpan sebagai saldo (credit).
create or replace function public.reallocate_lease(p_lease_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  l public.leases%rowtype;
  pay record;
  inv record;
  remaining bigint;
  alloc bigint;
  cur_m date;
  max_m date;
  next_m date;
begin
  select * into l from public.leases where id = p_lease_id for update;
  if not found then
    raise exception 'Sewa tidak ditemukan';
  end if;

  cur_m := date_trunc('month', public.app_today())::date;
  max_m := (cur_m + interval '60 months')::date;
  if l.end_date is not null then
    max_m := least(max_m, date_trunc('month', l.end_date)::date);
  end if;

  delete from public.payment_allocations pa
  using public.payments py
  where pa.payment_id = py.id and py.lease_id = p_lease_id;

  -- buang tagihan masa depan yang tidak punya potongan / perpanjangan; dibuat lagi bila perlu
  delete from public.invoices i
  where i.lease_id = p_lease_id
    and i.period_month > cur_m
    and i.extended_due_date is null
    and not exists (select 1 from public.invoice_adjustments ad where ad.invoice_id = i.id);

  if l.status = 'active' then
    perform public.ensure_invoices(p_lease_id, cur_m);
  end if;

  for pay in
    select id, amount from public.payments where lease_id = p_lease_id order by paid_at, created_at
  loop
    remaining := pay.amount;
    while remaining > 0 loop
      select ib.id, ib.balance into inv
      from public.invoice_balances ib
      where ib.lease_id = p_lease_id and ib.balance > 0
      order by ib.period_month
      limit 1;

      if not found then
        select (max(period_month) + interval '1 month')::date into next_m
        from public.invoices where lease_id = p_lease_id;
        next_m := coalesce(next_m, date_trunc('month', l.start_date)::date);
        exit when next_m > max_m;
        perform public.ensure_invoices(p_lease_id, next_m);
        continue;
      end if;

      alloc := least(remaining, inv.balance);
      insert into public.payment_allocations (owner_id, payment_id, invoice_id, amount)
      values (l.owner_id, pay.id, inv.id, alloc)
      on conflict (payment_id, invoice_id)
        do update set amount = public.payment_allocations.amount + excluded.amount;
      remaining := remaining - alloc;
    end loop;
  end loop;
end;
$$;

-- Catat pembayaran. p_months = bayar N bulan (nominal dihitung otomatis bila p_amount kosong).
create or replace function public.record_payment(
  p_lease_id uuid,
  p_amount bigint default null,
  p_months integer default null,
  p_paid_at date default null,
  p_method public.payment_method default 'transfer',
  p_proof_path text default null,
  p_notes text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  l public.leases%rowtype;
  v_amount bigint;
  v_unpaid integer;
  v_prev integer := -1;
  v_next date;
  v_paid_at date := coalesce(p_paid_at, public.app_today());
  v_prefix text;
  v_id uuid;
begin
  select * into l from public.leases where id = p_lease_id;
  if not found then
    raise exception 'Sewa tidak ditemukan';
  end if;

  perform public.reallocate_lease(p_lease_id);

  if p_months is not null and p_months > 0 then
    loop
      select count(*) into v_unpaid
      from public.invoice_balances where lease_id = p_lease_id and balance > 0;
      exit when v_unpaid >= p_months;
      if v_unpaid = v_prev then
        raise exception 'Jumlah bulan melebihi masa sewa';
      end if;
      v_prev := v_unpaid;
      select coalesce((max(period_month) + interval '1 month')::date, date_trunc('month', l.start_date)::date)
        into v_next from public.invoices where lease_id = p_lease_id;
      if v_next > (date_trunc('month', public.app_today()) + interval '60 months')::date then
        raise exception 'Maksimal bayar di muka 60 bulan';
      end if;
      perform public.ensure_invoices(p_lease_id, v_next);
    end loop;

    select sum(balance)::bigint into v_amount
    from (
      select balance from public.invoice_balances
      where lease_id = p_lease_id and balance > 0
      order by period_month
      limit p_months
    ) s;
  end if;

  v_amount := coalesce(p_amount, v_amount);
  if v_amount is null or v_amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0';
  end if;

  select receipt_prefix into v_prefix from public.profiles where id = l.owner_id;

  insert into public.payments (owner_id, lease_id, paid_at, amount, method, proof_path, notes, receipt_no)
  values (
    l.owner_id, l.id, v_paid_at, v_amount, p_method, p_proof_path, p_notes,
    coalesce(v_prefix, 'KW') || '-' || to_char(v_paid_at, 'YYYYMM') || '-'
      || lpad(nextval('public.receipt_seq')::text, 4, '0')
  )
  returning id into v_id;

  perform public.reallocate_lease(p_lease_id);
  return v_id;
end;
$$;

create or replace function public.delete_payment(p_payment_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_lease uuid;
begin
  delete from public.payments where id = p_payment_id returning lease_id into v_lease;
  if v_lease is null then
    raise exception 'Pembayaran tidak ditemukan';
  end if;
  perform public.reallocate_lease(v_lease);
end;
$$;

-- Potong biaya renovasi dari tagihan: dibagi rata ke N bulan, sisa pembulatan di bulan terakhir.
create or replace function public.apply_renovation(p_renovation_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  r public.renovations%rowtype;
  l public.leases%rowtype;
  per bigint;
  rem bigint;
  amt bigint;
  m date;
  inv public.invoices%rowtype;
  existing bigint;
begin
  select * into r from public.renovations where id = p_renovation_id;
  if not found then
    raise exception 'Renovasi tidak ditemukan';
  end if;

  delete from public.invoice_adjustments where renovation_id = r.id;

  if r.lease_id is null then
    return;
  end if;

  select * into l from public.leases where id = r.lease_id;
  per := r.cost / r.installments;
  rem := r.cost - per * r.installments;

  for i in 0 .. r.installments - 1 loop
    m := (r.start_month + make_interval(months => i))::date;
    if m < date_trunc('month', l.start_date)::date then
      raise exception 'Bulan potongan % sebelum awal sewa', to_char(m, 'MM/YYYY');
    end if;
    if l.end_date is not null and m > date_trunc('month', l.end_date)::date then
      raise exception 'Bulan potongan % melewati akhir sewa', to_char(m, 'MM/YYYY');
    end if;

    perform public.ensure_invoices(l.id, m);
    select * into inv from public.invoices where lease_id = l.id and period_month = m;

    amt := per + case when i = r.installments - 1 then rem else 0 end;
    select coalesce(sum(amount), 0) into existing from public.invoice_adjustments where invoice_id = inv.id;
    if existing + amt > inv.base_amount then
      raise exception 'Potongan bulan % melebihi harga sewa. Tambah jumlah cicilan.', to_char(m, 'MM/YYYY');
    end if;

    insert into public.invoice_adjustments (owner_id, invoice_id, renovation_id, amount, reason)
    values (l.owner_id, inv.id, r.id, amt, 'Renovasi: ' || r.title);
  end loop;

  perform public.reallocate_lease(l.id);
end;
$$;

create or replace function public.delete_renovation(p_renovation_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_lease uuid;
begin
  delete from public.renovations where id = p_renovation_id returning lease_id into v_lease;
  if v_lease is not null then
    perform public.reallocate_lease(v_lease);
  end if;
end;
$$;

-- Perubahan harga / tanggal jatuh tempo / akhir sewa diterapkan ke tagihan bulan depan.
create or replace function public.on_lease_updated()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cur_m date := date_trunc('month', public.app_today())::date;
begin
  if new.monthly_rent <> old.monthly_rent or new.due_day <> old.due_day then
    update public.invoices
    set base_amount = new.monthly_rent,
        due_date = period_month + (new.due_day - 1)
    where lease_id = new.id and period_month > cur_m;
  end if;

  if new.end_date is not null and new.end_date is distinct from old.end_date then
    delete from public.invoices
    where lease_id = new.id and period_month > date_trunc('month', new.end_date)::date;
  end if;

  perform public.reallocate_lease(new.id);
  return new;
end;
$$;

create trigger leases_after_update
  after update of monthly_rent, due_day, end_date, status on public.leases
  for each row execute function public.on_lease_updated();

revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bukti transfer & struk pengeluaran (private, folder = owner id)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('expense-receipts', 'expense-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "owner_files_select" on storage.objects for select to authenticated
  using (bucket_id in ('payment-proofs', 'expense-receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('payment-proofs', 'expense-receipts')
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner_files_update" on storage.objects for update to authenticated
  using (bucket_id in ('payment-proofs', 'expense-receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner_files_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('payment-proofs', 'expense-receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
