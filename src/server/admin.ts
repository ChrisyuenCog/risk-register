import { headers } from "next/headers";

/**
 * Administrator identification. Admins are the emails in the ADMIN_EMAILS
 * environment variable (comma-separated, case-insensitive), defaulting to
 * the system owner. Identity comes from App Service authentication
 * (x-ms-client-principal-name), so this is only meaningful when the app
 * runs behind the sign-in wall — with auth off there is no identity and
 * nobody is admin.
 */
const DEFAULT_ADMINS = ["cyuen@cognitionlearninggroup.com"];

export function adminEmails(): string[] {
  const env = (process.env.ADMIN_EMAILS ?? "").trim();
  const list = env ? env.split(",").map((e) => e.trim().toLowerCase()) : DEFAULT_ADMINS;
  return list.filter(Boolean);
}

export function currentUserEmail(): string | null {
  try {
    return headers().get("x-ms-client-principal-name")?.toLowerCase() ?? null;
  } catch {
    return null; // outside a request scope
  }
}

export function isAdmin(): boolean {
  const email = currentUserEmail();
  return !!email && adminEmails().includes(email);
}
