import { supabase } from "@/integrations/supabase/client";
import { actions, getState } from "./store";
import type { Post } from "./seed";

// Collaboration posts live in the database; the store's `posts` slice is only a cache.
const FAIL = "Não foi possível salvar. Verifique sua conexão e tente novamente.";
const LEGACY_KEY = "chp-legacy-posts";
const isUuid = (id: string) => /^[0-9a-f-]{36}$/.test(id);

type Row = { id: string; author_id: string; author_name: string; title: string; description: string; instrument: string | null; activity: string; wanted_date: string | null; period: string | null; interest_count: number; created_at: string };
const toPost = (r: Row, interests: { post_id: string; user_id: string; user_name: string }[]): Post => {
  const mine = interests.filter((i) => i.post_id === r.id);
  return {
    id: r.id, authorId: r.author_id, authorName: r.author_name, title: r.title, description: r.description,
    instrument: r.instrument ?? undefined, activity: r.activity, date: r.wanted_date ?? undefined, period: r.period ?? undefined,
    createdAt: r.created_at.slice(0, 10), interested: mine.map((i) => i.user_id), interestedNames: mine.map((i) => i.user_name), interestCount: r.interest_count,
  };
};

/** Posts this browser created before they were saved online, kept aside so the author can import them. */
export function legacyPosts(userId: string): Post[] {
  try { return (JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]") as Post[]).filter((p) => p.authorId === userId); } catch { return []; }
}

export async function loadPosts(userId: string | null) {
  // Before replacing the cache, set aside any locally created posts (non-database ids, not demo ones).
  const local = getState().posts.filter((p) => !isUuid(p.id) && !/^p\d+$/.test(p.id));
  if (local.length) {
    const kept = (() => { try { return JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]") as Post[]; } catch { return []; } })();
    const ids = new Set(kept.map((p) => p.id));
    localStorage.setItem(LEGACY_KEY, JSON.stringify([...kept, ...local.filter((p) => !ids.has(p.id))]));
  }
  if (!userId) return actions.patch((s) => ({ ...s, posts: [] }));
  const [p, i] = await Promise.all([
    supabase.from("posts").select("*").order("created_at", { ascending: false }),
    supabase.from("post_interests").select("post_id,user_id,user_name"),
  ]);
  actions.patch((s) => ({ ...s, posts: (p.data ?? []).map((r) => toPost(r, i.data ?? [])) }));
}

type Draft = Pick<Post, "title" | "description" | "instrument" | "activity" | "date" | "period">;
const toRow = (d: Draft) => ({ title: d.title, description: d.description, instrument: d.instrument ?? null, activity: d.activity, wanted_date: d.date ?? null, period: d.period ?? null });

export async function savePost(d: Draft, id?: string): Promise<{ id?: string; error?: string }> {
  const s = getState();
  const me = s.users.find((u) => u.id === s.currentUserId);
  if (!me) return { error: "Entre na sua conta para publicar." };
  if (id) {
    const { data, error } = await supabase.from("posts").update(toRow(d)).eq("id", id).select().maybeSingle();
    if (error || !data) return { error: FAIL };
    actions.patch((st) => ({ ...st, posts: st.posts.map((p) => (p.id === id ? { ...p, ...d } : p)) }));
    return { id };
  }
  const { data, error } = await supabase.from("posts").insert({ ...toRow(d), author_id: me.id, author_name: me.name }).select().single();
  if (error) return { error: FAIL };
  actions.patch((st) => ({ ...st, posts: [toPost(data, []), ...st.posts] }));
  return { id: data.id };
}

export async function deletePost(id: string): Promise<string | null> {
  const { error, count } = await supabase.from("posts").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return FAIL;
  actions.patch((st) => ({ ...st, posts: st.posts.filter((p) => p.id !== id) }));
  return null;
}

export async function showInterest(postId: string): Promise<string | null> {
  const s = getState();
  const p = s.posts.find((x) => x.id === postId);
  const me = s.users.find((u) => u.id === s.currentUserId);
  if (!p || !me) return FAIL;
  if (p.authorId === me.id) return "Você é o autor desta publicação.";
  if (p.interested.includes(me.id)) return "Você já demonstrou interesse nesta publicação.";
  const { error } = await supabase.from("post_interests").insert({ post_id: postId, user_id: me.id, user_name: me.name });
  if (error) return error.code === "23505" ? "Você já demonstrou interesse nesta publicação." : FAIL;
  actions.patch((st) => ({ ...st, posts: st.posts.map((x) => (x.id === postId ? { ...x, interested: [...x.interested, me.id], interestCount: (x.interestCount ?? 0) + 1 } : x)) }));
  return null;
}

/** Saves the author's old local posts online, skipping any already imported (same title and description). */
export async function importLegacyPosts(userId: string): Promise<{ imported: number; error?: string }> {
  const old = legacyPosts(userId);
  const existing = getState().posts.filter((p) => p.authorId === userId);
  let imported = 0;
  for (const p of old) {
    if (!existing.some((e) => e.title === p.title && e.description === p.description)) {
      const r = await savePost(p);
      if (r.error) return { imported, error: r.error };
      imported++;
    }
  }
  const rest = (() => { try { return (JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]") as Post[]).filter((p) => p.authorId !== userId); } catch { return []; } })();
  localStorage.setItem(LEGACY_KEY, JSON.stringify(rest));
  return { imported };
}
