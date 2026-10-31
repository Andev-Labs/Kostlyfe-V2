begin;
select plan(14);

-- Fixture: owner, kontrakan, penghuni, sewa mulai 2 bulan lalu (Rp 1.000.000, jatuh tempo tgl 5)
insert into auth.users (id, email) values ('22222222-2222-2222-2222-222222222222', 'test@kostlyfe.test');
insert into public.properties (id, owner_id, name, default_rent)
values ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Test House', 1000000);
insert into public.tenants (id, owner_id, name)
values ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Tester');
insert into public.leases (id, owner_id, property_id, tenant_id, start_date, monthly_rent, due_day)
values ('c0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
        (date_trunc('month', public.app_today()) - interval '2 months')::date, 1000000, 5);

create temp view t_inv as
  select * from public.invoice_balances where lease_id = 'c0000000-0000-0000-0000-000000000001';

-- ensure_invoices
select is(public.ensure_invoices('c0000000-0000-0000-0000-000000000001'), 3, 'membuat 3 tagihan s/d bulan ini');
select is(public.ensure_invoices('c0000000-0000-0000-0000-000000000001'), 0, 'idempotent');
select is((select count(*)::int from t_inv where status = 'telat' and period_month < date_trunc('month', public.app_today())), 2, 'dua bulan lalu & bulan lalu telat');

-- pembayaran parsial ke tagihan tertua
select lives_ok($$ select public.record_payment('c0000000-0000-0000-0000-000000000001', 400000) $$, 'bayar parsial');
select is((select status from t_inv order by period_month limit 1), 'telat', 'parsial yang lewat jatuh tempo tetap telat');
select is((select balance from t_inv order by period_month limit 1), 600000::bigint, 'sisa tagihan tertua 600rb');

-- bayar 6 bulan: lunasi 3 tagihan terbuka + 3 bulan ke depan
select lives_ok($$ select public.record_payment('c0000000-0000-0000-0000-000000000001', null, 6) $$, 'bayar 6 bulan');
select is((select max(amount) from public.payments where lease_id = 'c0000000-0000-0000-0000-000000000001'),
          5600000::bigint, 'nominal 6 bulan dihitung otomatis (600rb + 5 x 1jt)');
select is((select count(*)::int from t_inv where balance = 0), 6, '6 tagihan lunas');
select is((select count(*)::int from t_inv where balance > 0), 0, 'tidak ada tagihan terbuka');

-- renovasi 1.000.001 dicicil 3 bulan mulai bulan depan -> pembulatan di bulan terakhir, kelebihan bayar jadi saldo
insert into public.renovations (id, owner_id, property_id, lease_id, title, cost, renovation_date, start_month, installments)
values ('d0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
        'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
        'Atap', 1000001, public.app_today(), (date_trunc('month', public.app_today()) + interval '1 month')::date, 3);
select public.apply_renovation('d0000000-0000-0000-0000-000000000001');
select results_eq(
  $$ select a.amount from public.invoice_adjustments a join public.invoices i on i.id = a.invoice_id
     where a.renovation_id = 'd0000000-0000-0000-0000-000000000001' order by i.period_month $$,
  $$ values (333333::bigint), (333333::bigint), (333335::bigint) $$,
  'potongan dibagi 3 dengan sisa di bulan terakhir');
select is((select credit from public.lease_summaries where id = 'c0000000-0000-0000-0000-000000000001') >= 0, true,
          'saldo tidak negatif setelah potongan');

-- perpanjangan
update public.invoices set extended_due_date = public.app_today() + 10
where lease_id = 'c0000000-0000-0000-0000-000000000001';
select public.delete_payment((select id from public.payments where lease_id = 'c0000000-0000-0000-0000-000000000001' and amount = 5600000));
select is((select count(*)::int from t_inv where status = 'diperpanjang'), 8,
          'tagihan terbuka dengan perpanjangan berstatus diperpanjang');

-- RLS: user lain tidak bisa melihat data
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.invoices), 0, 'RLS: user lain tidak melihat tagihan');
reset role;

select * from finish();
rollback;
