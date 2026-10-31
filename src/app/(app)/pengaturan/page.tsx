import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/features/pengaturan/profile-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  return (
    <>
      <PageHeader title="Pengaturan" />
      {profile && <ProfileForm profile={profile} />}
    </>
  );
}
