import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">Daftar Kostlyfe</h1>
          <p className="text-sm text-muted-foreground">Buat akun pemilik untuk mulai mengelola kontrakanmu</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
