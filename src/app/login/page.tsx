import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">Kostlyfe</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk mengelola kontrakanmu</p>
        </div>
        <Suspense>
          <ConfirmError searchParams={searchParams} />
        </Suspense>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}

async function ConfirmError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  if (error !== "konfirmasi") return null;
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
      Link konfirmasi tidak valid atau sudah kedaluwarsa.
    </p>
  );
}
