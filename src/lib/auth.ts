import { useEffect } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { actions } from "./store";
import { loadRecords } from "./records";

export const MIN_PASSWORD = 6;

/** Sign-up form rules. Returns an error message in Portuguese, or null when valid. */
export function validateSignup(f: { name: string; email: string; password: string; confirm: string }): string | null {
  if (f.name.trim().length < 3) return "Informe seu nome completo.";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return "Informe um e-mail válido.";
  return validateNewPassword(f.password, f.confirm);
}

export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD) return `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
  if (password !== confirm) return "As senhas não coincidem.";
  return null;
}

/** Turns auth errors into friendly Portuguese messages. */
export function authErrorMessage(err: { code?: string | undefined; message?: string; status?: number | undefined } | null | undefined): string {
  const code = err?.code ?? "";
  const msg = (err?.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed" || msg.includes("not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "Já existe uma conta com este e-mail.";
  if (code === "weak_password" || msg.includes("password")) return "Escolha uma senha mais forte, com pelo menos 6 caracteres e difícil de adivinhar.";
  if (code.startsWith("over_") || err?.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível concluir. Tente novamente.";
}

/** Loads the account's profile and makes it the current user of the app store. */
export async function syncUser(user: AuthUser | null) {
  if (!user) { actions.setSessionUser(null); return void loadRecords(null); }
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fallbackName = String(meta["name"] || meta["full_name"] || (user.email ?? "").split("@")[0] || "Usuário");
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) {
    const { data } = await supabase.from("profiles").insert({ id: user.id, name: fallbackName }).select().maybeSingle();
    profile = data;
  }
  actions.setSessionUser({
    id: user.id,
    name: profile?.name || fallbackName,
    email: user.email ?? "",
    instrument: profile?.instrument ?? undefined,
    avatar: profile?.avatar_url ?? undefined,
  });
  await loadRecords(user.id);
}

/** Keeps the app store in step with the signed-in account. Mount once in the root route. */
export function useAuthSync() {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Defer: calling Supabase inside the callback can deadlock the auth client.
      setTimeout(() => {
        void syncUser(session?.user ?? null).then(() => {
          const back = sessionStorage.getItem("chp-redirect");
          if (event === "SIGNED_IN" && back && window.location.pathname === "/") {
            sessionStorage.removeItem("chp-redirect");
            window.history.pushState(null, "", back);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        });
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);
}

export async function saveProfile(userId: string, data: { name: string; instrument?: string | undefined; avatar?: string | undefined }) {
  const { error } = await supabase
    .from("profiles")
    .update({ name: data.name, instrument: data.instrument ?? null, avatar_url: data.avatar ?? null })
    .eq("id", userId);
  return error;
}
