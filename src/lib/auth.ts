export {
  loginUser as login,
  isAuthenticated,
  getSessionUser,
  setDemoSession,
  logout,
} from "@/services/authService";

export type { UserSession } from "@/services/authService";
export type { UserRole, Permission, PersonaProfile } from "@/lib/types";
export { ROLE_PERMISSIONS, KNOWN_PERSONAS } from "@/lib/types";
export { hasPermission, getRolePermissions, usePermissions } from "@/lib/rbac";

export function getDashboardTitle(): string {
  if (typeof window === "undefined") return "Admin Dashboard";
  const token = localStorage.getItem("auth_token");
  if (!token) return "Admin Dashboard";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.company_slug && payload.company_slug !== "global") {
      return `${payload.company_slug.toUpperCase()} Security Console`;
    }
    if (payload.company_slug === "global") {
      return "Global Admin Dashboard";
    }
    const email = payload.email || "";
    if (email.toLowerCase().includes("admin")) {
      return "Admin Dashboard";
    }
    return "Analyst Dashboard";
  } catch {
    const userRaw = localStorage.getItem("sentinel_user");
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u.companySlug) return `${u.companySlug.toUpperCase()} Security Console`;
      } catch {
        // ignore JSON parse
      }
    }
    return "Admin Dashboard";
  }
}
