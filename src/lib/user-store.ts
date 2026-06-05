const USER_KEY = "earnest.user.v1";

export function getStoredUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_KEY) ?? "";
}

export function saveUserName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, name.trim());
}
