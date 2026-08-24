const ADMIN_KEY = "rcsi_admin_logged_in";
const ADMIN_USERNAME = "admin@rcsi";
const ADMIN_PASSWORD = "RCSI-Admin-2026"; // change this if you want

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAsAdmin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}