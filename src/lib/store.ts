import { useSyncExternalStore } from "react";
import { createSeed, type State, type Post, type User } from "./seed";

// Local persistence layer. Swap these functions for a backend later; components only use useStore + actions.
const KEY = "chp-state-v1";
const serverState = createSeed();
let state: State = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : createSeed();
  } catch {
    state = createSeed();
  }
}

function set(fn: (s: State) => State) {
  load();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!loaded) { load(); l(); }
      return () => listeners.delete(l);
    },
    () => sel(state),
    () => sel(serverState),
  );
}

export const getState = () => { load(); return state; };
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString().slice(0, 10);

export function useCurrentUser() {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
}

export const actions = {
  /** Called by the auth sync (src/lib/auth.ts) with the signed-in Cloud account, or null after sign-out. */
  setSessionUser(user: User | null) {
    set((s) => {
      if (!user) return { ...s, currentUserId: null };
      const exists = s.users.some((u) => u.id === user.id);
      return { ...s, users: exists ? s.users.map((u) => (u.id === user.id ? { ...u, ...user } : u)) : [...s.users, user], currentUserId: user.id };
    });
  },
  updateProfile(data: { name: string; email?: string; instrument?: string | undefined; avatar?: string | undefined }) {
    set((s) => ({ ...s, users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, ...data } : u)) }));
  },
  enroll(classId: string) {
    const s = getState();
    const c = s.classes.find((x) => x.id === classId)!;
    if (c.enrolled >= c.capacity) return "Não há vagas disponíveis nesta turma.";
    if (s.enrollments.some((e) => e.classId === classId && e.userId === s.currentUserId)) return "Você já solicitou matrícula nesta turma.";
    const course = s.courses.find((x) => x.id === c.courseId)!;
    set((st) => ({
      ...st,
      classes: st.classes.map((x) => (x.id === classId ? { ...x, enrolled: x.enrolled + 1 } : x)),
      enrollments: [...st.enrollments, { id: uid(), classId, userId: st.currentUserId!, status: "Em análise", createdAt: now() }],
      notifications: [{ id: uid(), userId: st.currentUserId!, text: `Sua solicitação de matrícula em ${course.name} — ${c.level} está em análise.`, createdAt: now(), read: false }, ...st.notifications],
    }));
    return null;
  },
  reserve(spaceId: string, date: string, time: string, purpose: string) {
    const s = getState();
    if (s.reservations.some((r) => r.spaceId === spaceId && r.date === date && r.time === time && r.status !== "Cancelada")) return "Este horário já está reservado.";
    const space = s.spaces.find((x) => x.id === spaceId)!;
    set((st) => ({
      ...st,
      reservations: [...st.reservations, { id: uid(), spaceId, date, time, purpose, userId: st.currentUserId!, status: "Pendente" }],
      notifications: [{ id: uid(), userId: st.currentUserId!, text: `Reserva solicitada: ${space.name}, ${date.split("-").reverse().join("/")} às ${time}.`, createdAt: now(), read: false }, ...st.notifications],
    }));
    return null;
  },
  cancelReservation(id: string) {
    set((s) => ({ ...s, reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: "Cancelada" } : r)) }));
  },
  savePost(data: Omit<Post, "id" | "authorId" | "authorName" | "createdAt" | "interested">, id?: string) {
    const newId = id ?? uid();
    set((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      if (id) return { ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, ...data } : p)) };
      return { ...s, posts: [{ ...data, id: newId, authorId: me.id, authorName: me.name, createdAt: now(), interested: [] }, ...s.posts] };
    });
    return newId;
  },
  deletePost(id: string) { set((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) })); },
  showInterest(postId: string) {
    const s = getState();
    const p = s.posts.find((x) => x.id === postId)!;
    const me = s.users.find((u) => u.id === s.currentUserId)!;
    if (p.authorId === me.id) return "Você é o autor desta publicação.";
    if (p.interested.includes(me.id)) return "Você já demonstrou interesse nesta publicação.";
    set((st) => ({
      ...st,
      posts: st.posts.map((x) => (x.id === postId ? { ...x, interested: [...x.interested, me.id] } : x)),
      notifications: [{ id: uid(), userId: p.authorId, text: `${me.name} demonstrou interesse na sua publicação “${p.title}”.`, createdAt: now(), read: false }, ...st.notifications],
    }));
    return null;
  },
  markNotificationsRead() {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === s.currentUserId ? { ...n, read: true } : n)) }));
  },
  resetDemo() {
    set((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      const seed = createSeed();
      return me ? { ...seed, users: [...seed.users.filter((u) => u.id !== me.id), me], currentUserId: me.id } : seed;
    });
  },
};

export const fmtDate = (d: string) => d.split("-").reverse().join("/");
