import { supabase } from "@/integrations/supabase/client";
import { actions, getState } from "./store";
import type { Enrollment, Notification, Reservation } from "./seed";

// Enrollments, reservations and notifications live in the database; the store is only a cache.
// Every action writes first and updates the screen only after the database confirms.

const day = (ts: string) => ts.slice(0, 10);
const FAIL = "Não foi possível salvar. Verifique sua conexão e tente novamente.";

export async function loadRecords(userId: string | null) {
  const { data: taken } = await supabase.rpc("taken_slots");
  const takenRows: Reservation[] = (taken ?? []).map((t, i) => ({ id: `t${i}`, spaceId: t.space_id, date: t.day, time: t.slot, purpose: "", userId: "__other", status: "Confirmada" }));
  if (!userId) return actions.setRemote({ enrollments: [], reservations: [], taken: takenRows, notifications: [] });
  const [e, r, n] = await Promise.all([
    supabase.from("enrollments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("reservations").select("*").eq("user_id", userId),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  actions.setRemote({
    enrollments: (e.data ?? []).map((x) => ({ id: x.id, classId: x.class_id, userId: x.user_id, status: x.status as Enrollment["status"], createdAt: day(x.created_at) })),
    reservations: (r.data ?? []).map((x) => ({ id: x.id, spaceId: x.space_id, date: x.day, time: x.slot, purpose: x.purpose, userId: x.user_id, status: x.status as Reservation["status"] })),
    taken: takenRows,
    notifications: (n.data ?? []).map((x) => ({ id: x.id, userId: x.user_id, text: x.text, createdAt: day(x.created_at), read: x.read })),
  });
}

async function notify(userId: string, text: string) {
  const { data } = await supabase.from("notifications").insert({ user_id: userId, text }).select().single();
  if (data) actions.patch((s) => ({ ...s, notifications: [{ id: data.id, userId, text, createdAt: day(data.created_at), read: false }, ...s.notifications] }));
}

export async function enroll(classId: string): Promise<string | null> {
  const s = getState();
  const me = s.currentUserId!;
  const k = s.classes.find((x) => x.id === classId)!;
  if (k.enrolled >= k.capacity) return "Não há vagas disponíveis nesta turma.";
  if (s.enrollments.some((e) => e.classId === classId && e.userId === me && e.status !== "Cancelada")) return "Você já solicitou matrícula nesta turma.";
  const { data, error } = await supabase.from("enrollments").insert({ user_id: me, class_id: classId }).select().single();
  if (error) return error.code === "23505" ? "Você já solicitou matrícula nesta turma." : FAIL;
  const course = s.courses.find((c) => c.id === k.courseId)!;
  actions.patch((st) => ({
    ...st,
    enrollments: [{ id: data.id, classId, userId: me, status: "Pendente", createdAt: day(data.created_at) }, ...st.enrollments],
    classes: st.classes.map((x) => (x.id === classId ? { ...x, enrolled: x.enrolled + 1 } : x)),
  }));
  await notify(me, `Sua solicitação de matrícula em ${course.name} — ${k.level} está aguardando autorização.`);
  return null;
}

export async function cancelEnrollment(id: string): Promise<string | null> {
  const { data, error } = await supabase.from("enrollments").update({ status: "Cancelada", cancelled_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error || !data) return FAIL;
  actions.patch((st) => ({
    ...st,
    enrollments: st.enrollments.map((e) => (e.id === id ? { ...e, status: "Cancelada" } : e)),
    classes: st.classes.map((x) => (x.id === data.class_id ? { ...x, enrolled: Math.max(0, x.enrolled - 1) } : x)),
  }));
  return null;
}

export async function reserve(spaceId: string, date: string, time: string, purpose: string): Promise<string | null> {
  const s = getState();
  const me = s.currentUserId!;
  if (s.reservations.some((r) => r.spaceId === spaceId && r.date === date && r.time === time && r.status !== "Cancelada")) return "Este horário já está reservado.";
  const { data, error } = await supabase.from("reservations").insert({ user_id: me, space_id: spaceId, day: date, slot: time, purpose }).select().single();
  if (error) return error.code === "23505" ? "Este horário já está reservado." : FAIL;
  actions.patch((st) => ({ ...st, reservations: [...st.reservations, { id: data.id, spaceId, date, time, purpose, userId: me, status: "Pendente" }] }));
  const space = s.spaces.find((x) => x.id === spaceId)!;
  await notify(me, `Reserva solicitada: ${space.name}, ${date.split("-").reverse().join("/")} às ${time}.`);
  return null;
}

export async function cancelReservation(id: string): Promise<string | null> {
  const { data, error } = await supabase.from("reservations").update({ status: "Cancelada", cancelled_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error || !data) return FAIL;
  actions.patch((st) => ({ ...st, reservations: st.reservations.map((r) => (r.id === id ? { ...r, status: "Cancelada" } : r)) }));
  return null;
}

const isDb = (n: Notification) => /^[0-9a-f-]{36}$/.test(n.id);

export async function markRead(ids: string[]): Promise<string | null> {
  const dbIds = getState().notifications.filter((n) => ids.includes(n.id) && isDb(n)).map((n) => n.id);
  if (dbIds.length) {
    const { error } = await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).in("id", dbIds);
    if (error) return FAIL;
  }
  actions.patch((st) => ({ ...st, notifications: st.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)) }));
  return null;
}
