import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </main>
  );
}
