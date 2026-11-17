import { supabase } from "@/integrations/supabase/client";

export type Review = "Aprovada" | "Recusada";
export interface AdminEnrollment { id: string; userId: string; classId: string; status: string; createdAt: string; reviewedAt: string | null; cancelledAt: string | null; studentName: string; instrument: string | null }

/** Lists every enrollment request. The database only returns rows to accounts with the admin role. */
export async function loadAllEnrollments(): Promise<AdminEnrollment[] | null> {
  const { data, error } = await supabase.from("enrollments").select("*").order("created_at", { ascending: false });
  if (error) return null;
  const ids = [...new Set((data ?? []).map((e) => e.user_id))];
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,name,instrument").in("id", ids) : { data: [] };
  return (data ?? []).map((e) => {
    const p = profiles?.find((x) => x.id === e.user_id);
    return { id: e.id, userId: e.user_id, classId: e.class_id, status: e.status, createdAt: e.created_at, reviewedAt: e.reviewed_at, cancelledAt: e.cancelled_at, studentName: p?.name || "Aluno sem nome", instrument: p?.instrument ?? null };
  });
}

/** Only pending requests can be approved or refused. */
export function canReview(status: string) { return status === "Pendente"; }

export async function reviewEnrollment(id: string, status: Review): Promise<string | null> {
  const { data, error } = await supabase.from("enrollments").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "Pendente").select().maybeSingle();
  if (error || !data) return "Não foi possível salvar. A solicitação pode ter sido alterada; atualize a página.";
  return null;
}
