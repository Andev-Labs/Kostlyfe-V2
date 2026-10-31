begin;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333333', 'baru@kostlyfe.test', '{"full_name":"Budi Pemilik","phone":"081298765432"}'),
  ('44444444-4444-4444-4444-444444444444', 'tanpa.nama@kostlyfe.test', '{"full_name":"  ","phone":""}');

select is((select full_name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
          'Budi Pemilik', 'daftar: nama dari metadata');
select is((select phone from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
          '081298765432', 'daftar: No. HP dari metadata');
select is((select full_name from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
          'tanpa.nama', 'daftar: nama kosong pakai bagian depan email');
select is((select phone from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
          null, 'daftar: No. HP kosong jadi null');

select * from finish();
rollback;
