import { useSyncExternalStore } from "react";
import { createSeed, type State, type Post, type User, type Enrollment, type Reservation, type Notification } from "./seed";

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
  /** Replaces the signed-in user's records with what the database returned (src/lib/records.ts). */
  setRemote(r: { enrollments: Enrollment[]; reservations: Reservation[]; taken: Reservation[]; notifications: Notification[] }) {
    set((s) => {
      const demo = createSeed();
      const demoRes = demo.reservations;
      const takenKeys = new Set(r.reservations.map((x) => x.spaceId + x.date + x.time));
      return {
        ...s,
        enrollments: r.enrollments,
        reservations: [...demoRes, ...r.taken.filter((t) => !takenKeys.has(t.spaceId + t.date + t.time)), ...r.reservations],
        notifications: [...r.notifications, ...s.notifications.filter((n) => n.userId !== s.currentUserId && !/^[0-9a-f-]{36}$/.test(n.id))],
        classes: demo.classes.map((k) => ({ ...k, enrolled: k.enrolled + r.enrollments.filter((e) => e.classId === k.id && (e.status === "Pendente" || e.status === "Aprovada")).length })),
      };
    });
  },
  patch(fn: (s: State) => State) { set(fn); },
  resetDemo() {
    set((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      const seed = createSeed();
      return me ? { ...seed, users: [...seed.users.filter((u) => u.id !== me.id), me], currentUserId: me.id } : seed;
    });
  },
};

export const fmtDate = (d: string) => d.split("-").reverse().join("/");
