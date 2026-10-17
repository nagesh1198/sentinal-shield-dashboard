import { api } from "@/lib/api";
import type {
  LoginRequest,
  TokenResponse,
  UserRole,
  Permission,
} from "@/lib/types";
import { ROLE_PERMISSIONS, KNOWN_PERSONAS } from "@/lib/types";

const AUTH_KEY = "sentinel_authenticated";
const TOKEN_KEY = "auth_token";
const USER_KEY = "sentinel_user";

export interface UserSession {
  email: string;
  role: UserRole;
  name: string;
  companySlug?: string;
  permissions: Permission[];
}

/**
 * Resolves the role for a user given their token payload or known persona definition.
 */
function resolveUserRole(
  email: string,
  slug: string,
  payload?: Record<string, unknown>
): UserRole {
  if (payload?.role && typeof payload.role === "string") {
    const r = payload.role.toLowerCase();
    if (r in ROLE_PERMISSIONS) return r as UserRole;
  }
  if (KNOWN_PERSONAS[email]) {
    return KNOWN_PERSONAS[email].role;
  }
  if (slug === "global" && email === "admin@cadoc.io") {
    return "platform_owner";
  }
  return "read-only";
}

/**
 * Authenticates against POST /api/v1/auth/login
 * Stores token + session info in localStorage.
 */
export async function loginUser(
  email: string,
  password: string,
  companySlug?: string
): Promise<TokenResponse> {
  const slug = companySlug || "mock-acme";
  const data = await api.post<TokenResponse>("/api/v1/auth/login", {
    email,
    password,
    company_slug: slug,
  } satisfies LoginRequest);

  // Decode JWT payload
  let payload: Record<string, unknown> = {};
  let displayName = email.split("@")[0];
  try {
    payload = JSON.parse(atob(data.access_token.split(".")[1]));
    if (typeof payload.name === "string" && payload.name) {
      displayName = payload.name;
    }
  } catch {
    // ignore decode errors
  }

  const role = resolveUserRole(email, slug, payload);
  if (KNOWN_PERSONAS[email]?.displayName && !payload.name) {
    displayName = KNOWN_PERSONAS[email].displayName;
  }
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["read-only"];

  // Persist session
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      email,
      name: displayName,
      role,
      companySlug: slug,
      permissions,
    } satisfies UserSession)
  );

  setAuthCookie(data.access_token);

  return data;
}

const COOKIE_NAME = "sentinel_token";

export function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Strict${secure}`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

/**
 * Populates a simulated or offline demo session for testing specific personas.
 */
export function setDemoSession(
  email: string,
  customRole?: UserRole,
  customSlug?: string,
  customName?: string
): UserSession {
  const persona = KNOWN_PERSONAS[email];
  const role: UserRole =
    customRole || persona?.role || (email === "admin@cadoc.io" ? "platform_owner" : "tenant-admin");
  const companySlug = customSlug || persona?.companySlug || "mock-acme";
  const name = customName || persona?.displayName || email.split("@")[0];
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["read-only"];

  const session: UserSession = {
    email,
    name,
    role,
    companySlug,
    permissions,
  };

  if (typeof window !== "undefined") {
    const demoToken = `demo.${btoa(JSON.stringify({ email, name, role, company_slug: companySlug }))}.sig`;
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session));
    setAuthCookie(demoToken);
  }

  return session;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getSessionUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuthCookie();
}

