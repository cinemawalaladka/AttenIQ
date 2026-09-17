/**
 * Local Authentication Provider (v1)
 * Currently keeps auth 100% local with an active Admin session.
 * Designed to be swapped seamlessly with Supabase Auth or NextAuth in the future.
 */

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "admin" | "faculty" | "viewer";
  avatarUrl?: string;
}

export const LOCAL_ADMIN_USER: UserSession = {
  id: "usr_admin_001",
  name: "System Administrator",
  email: "admin@attendiq.internal",
  role: "admin",
};

export async function getCurrentUser(): Promise<UserSession> {
  // In v1 local mode, return default admin
  return LOCAL_ADMIN_USER;
}
