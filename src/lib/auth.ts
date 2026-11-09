import { headers } from "next/headers";

export type AppUser = {
  id: string;
  /** Anzeigename (Claim "name"), Fallback: UPN */
  name: string;
  email?: string;
  roles: string[];
};

type Claim = { typ: string; val: string };
type HeaderReader = { get(name: string): string | null };
type Env = Record<string, string | undefined>;

const OID_CLAIM = "http://schemas.microsoft.com/identity/claims/objectidentifier";

/**
 * Liest die Identität aus den Easy-Auth-Headern (X-MS-CLIENT-PRINCIPAL*).
 * Die Header sind vertrauenswürdig, weil Easy Auth sie bei aktivem
 * "Require authentication" setzt und eingehende Werte überschreibt.
 * Reine Funktion, damit sie ohne Next.js-Request testbar ist.
 */
export function resolveUser(h: HeaderReader, env: Env = process.env): AppUser | null {
  const raw = h.get("x-ms-client-principal");
  if (raw) {
    let claims: Claim[] = [];
    try {
      const principal = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
      claims = Array.isArray(principal?.claims) ? principal.claims : [];
    } catch {
      return null;
    }
    const get = (t: string) => claims.find((c) => c.typ === t)?.val;
    const upn = h.get("x-ms-client-principal-name") ?? get("preferred_username");
    return {
      id: h.get("x-ms-client-principal-id") ?? get(OID_CLAIM) ?? "",
      name: get("name") ?? upn ?? "",
      email: get("preferred_username") ?? get("emails") ?? upn ?? undefined,
      roles: claims.filter((c) => c.typ === "roles").map((c) => c.val),
    };
  }

  // Nur lokal: Fake-User per .env.local. Darf in Produktion NIE greifen.
  if (env.NODE_ENV !== "production" && env.DEV_USER_NAME) {
    return {
      id: env.DEV_USER_ID ?? "dev-user",
      name: env.DEV_USER_DISPLAY_NAME ?? env.DEV_USER_NAME,
      email: env.DEV_USER_NAME,
      roles: [],
    };
  }
  return null;
}

export async function getUser(): Promise<AppUser | null> {
  return resolveUser(await headers());
}

export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export const LOGOUT_URL = "/.auth/logout?post_logout_redirect_uri=/";
