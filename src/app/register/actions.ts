"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = { error?: string; info?: string };

const MIN_PASSWORD = 6;

export async function register(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!fullName || !email || !password) return { error: "Nama, email, dan password wajib diisi." };
  if (password.length < MIN_PASSWORD) return { error: `Password minimal ${MIN_PASSWORD} karakter.` };
  if (password !== confirm) return { error: "Konfirmasi password tidak sama." };
  if (phone && !/^\+?[0-9\s-]{8,20}$/.test(phone)) return { error: "No. HP tidak valid." };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone || null },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") return { error: "Email sudah terdaftar. Silakan masuk." };
    if (error.code === "weak_password") return { error: "Password terlalu lemah." };
    if (error.status === 429) return { error: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi." };
    return { error: "Pendaftaran gagal. Coba lagi." };
  }

  // Dengan konfirmasi email aktif, Supabase tidak membuat sesi (dan tidak membocorkan email yang sudah terdaftar).
  if (!data.session) {
    return { info: `Kami mengirim link konfirmasi ke ${email}. Buka link tersebut untuk mengaktifkan akun.` };
  }

  redirect("/dashboard");
}
