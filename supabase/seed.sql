-- Data contoh untuk development. Login: owner@kostlyfe.test / password123
-- Tanggal relatif terhadap hari ini supaya skenario selalu relevan.

do $$
declare
  uid uuid := '11111111-1111-1111-1111-111111111111';
  cur_m date := date_trunc('month', public.app_today())::date;
  p_a uuid; p_b uuid; p_c uuid;
  t_a uuid; t_b uuid; t_c uuid;
  l_a uuid; l_b uuid; l_c uuid;
  r_c uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'owner@kostlyfe.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Pemilik Kontrakan"}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid,
          jsonb_build_object('sub', uid::text, 'email', 'owner@kostlyfe.test', 'email_verified', true),
          'email', uid::text, now(), now(), now());

  update public.profiles
  set phone = '081234567890', bank_name = 'BCA', bank_account = '1234567890', bank_holder = 'Pemilik Kontrakan'
  where id = uid;

  insert into public.properties (owner_id, name, address, default_rent)
  values (uid, 'Kontrakan Melati', 'Jl. Melati No. 12', 1500000) returning id into p_a;
  insert into public.properties (owner_id, name, address, default_rent)
  values (uid, 'Kontrakan Mawar', 'Jl. Mawar No. 3', 1200000) returning id into p_b;
  insert into public.properties (owner_id, name, address, default_rent)
  values (uid, 'Kontrakan Kenanga', 'Gg. Kenanga No. 7', 1800000) returning id into p_c;

  insert into public.tenants (owner_id, name, phone, nik)
  values (uid, 'Budi Santoso', '081211112222', '3201010101010001') returning id into t_a;
  insert into public.tenants (owner_id, name, phone, nik)
  values (uid, 'Siti Aminah', '081233334444', '3201010101010002') returning id into t_b;
  insert into public.tenants (owner_id, name, phone, nik)
  values (uid, 'Andi Wijaya', '081255556666', '3201010101010003') returning id into t_c;

  -- A: bayar rutin bulanan, bulan ini belum bayar (telat, jatuh tempo tgl 1)
  insert into public.leases (owner_id, property_id, tenant_id, start_date, monthly_rent, due_day, deposit)
  values (uid, p_a, t_a, (cur_m - interval '8 months')::date, 1500000, 1, 1500000) returning id into l_a;
  for i in 1 .. 8 loop
    insert into public.payments (owner_id, lease_id, paid_at, amount, method, receipt_no)
    values (uid, l_a, (cur_m - make_interval(months => 9 - i) + interval '2 days')::date, 1500000, 'transfer',
            'KW-SEED-A' || i);
  end loop;

  -- B: bayar di muka 6 bulan saat mulai sewa
  insert into public.leases (owner_id, property_id, tenant_id, start_date, monthly_rent, due_day, deposit)
  values (uid, p_b, t_b, (cur_m - interval '3 months')::date, 1200000, 1, 0) returning id into l_b;
  insert into public.payments (owner_id, lease_id, paid_at, amount, method, receipt_no, notes)
  values (uid, l_b, (cur_m - interval '3 months')::date, 7200000, 'transfer', 'KW-SEED-B1', 'Bayar di muka 6 bulan');

  -- C: bulan lalu telat & diberi perpanjangan; renovasi atap 900rb dicicil 3 bulan mulai bulan ini
  insert into public.leases (owner_id, property_id, tenant_id, start_date, monthly_rent, due_day, deposit)
  values (uid, p_c, t_c, (cur_m - interval '10 months' + interval '9 days')::date, 1800000, 10, 1800000)
  returning id into l_c;
  for i in 1 .. 9 loop
    insert into public.payments (owner_id, lease_id, paid_at, amount, method, receipt_no)
    values (uid, l_c, (cur_m - make_interval(months => 11 - i) + interval '9 days')::date, 1800000, 'cash',
            'KW-SEED-C' || i);
  end loop;

  perform public.reallocate_lease(l_a);
  perform public.reallocate_lease(l_b);
  perform public.reallocate_lease(l_c);

  update public.invoices
  set extended_due_date = (public.app_today() + 7), extension_note = 'Minta waktu, gajian minggu depan'
  where lease_id = l_c and period_month = (cur_m - interval '1 month')::date;

  insert into public.renovations (owner_id, property_id, lease_id, title, description, cost, renovation_date, start_month, installments)
  values (uid, p_c, l_c, 'Perbaikan atap bocor', 'Penghuni talangi biaya tukang & genteng', 900000,
          (public.app_today() - 5), cur_m, 3)
  returning id into r_c;
  perform public.apply_renovation(r_c);

  insert into public.expenses (owner_id, property_id, category, amount, expense_date, notes) values
    (uid, p_a, 'pajak', 450000, (cur_m - interval '2 months' + interval '14 days')::date, 'PBB tahunan'),
    (uid, p_b, 'perbaikan', 250000, (cur_m - interval '1 month' + interval '3 days')::date, 'Ganti kran air'),
    (uid, null, 'kebersihan', 100000, (cur_m + interval '4 days')::date, 'Iuran kebersihan lingkungan');
end $$;
