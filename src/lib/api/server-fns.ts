import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getUserById, getUserByUsername, getUserByEmail, createUser, verifyPassword, updatePassword } from "./auth";
import { getProjectsForUser, upsertProject, deleteProjectForUser } from "./projects";
import { createSession, getSession as getDbSession, deleteSession } from "../db/sessions";
import type { Project } from "../projects-store";

const SESSION_COOKIE = "earnest_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

async function getSession(request: Request): Promise<{ userId?: number }> {
  const sessionId = getSessionId(request);
  if (!sessionId) return {};
  const session = await getDbSession(sessionId);
  return session ?? {};
}

function makeSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const { userId } = await getSession(request);
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user) return null;
  return { id: user.id, username: user.username, displayName: user.displayName };
});

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;
    if (!email) throw new Error("Please enter your email.");
    if (!password) throw new Error("Please enter your password.");
    const user = await getUserByEmail(email);
    if (!user) throw new Error("No account found with that email.");
    const ok = await verifyPassword(password, user.password);
    if (!ok) throw new Error("Incorrect password. Please try again.");
    const sessionId = await createSession(user.id);
    setResponseHeader("Set-Cookie", makeSessionCookie(sessionId));
    return {
      user: { id: user.id, username: user.username, displayName: user.displayName },
    };
  });

export const registerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; displayName: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;
    const displayName = data.displayName?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (!displayName) throw new Error("Please enter your name.");
    const existing = await getUserByEmail(email);
    if (existing) throw new Error("An account with that email already exists.");
    const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 20) + "_" + Date.now().toString().slice(-4);
    const user = await createUser(username, password, displayName, email);
    const sessionId = await createSession(user.id);
    setResponseHeader("Set-Cookie", makeSessionCookie(sessionId));
    return {
      user: { id: user.id, username: user.username, displayName: user.displayName },
    };
  });

export const resetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; displayName: string; newPassword: string }) => input)
  .handler(async ({ data }) => {
    const username = data.username?.trim().toLowerCase();
    const displayName = data.displayName?.trim().toLowerCase();
    const newPassword = data.newPassword;
    if (!username) throw new Error("Please enter your username.");
    if (!displayName) throw new Error("Please enter the name you registered with.");
    if (!newPassword || newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
    const user = await getUserByUsername(username);
    if (!user) throw new Error("No account found with that username.");
    if (user.displayName.trim().toLowerCase() !== displayName) throw new Error("The name you entered doesn't match our records.");
    await updatePassword(user.id, newPassword);
    return { ok: true };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const request = getRequest();
  const sessionId = getSessionId(request);
  if (sessionId) await deleteSession(sessionId);
  setResponseHeader("Set-Cookie", clearSessionCookie());
  return { ok: true };
});

export const fetchProjectsFn = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const { userId } = await getSession(request);
  if (!userId) throw new Error("Not authenticated");
  return getProjectsForUser(userId);
});

export const saveProjectFn = createServerFn({ method: "POST" })
  .inputValidator((input: { project: Project }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const { userId } = await getSession(request);
    if (!userId) throw new Error("Not authenticated");
    return upsertProject(userId, data.project);
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .inputValidator((input: { projectId: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const { userId } = await getSession(request);
    if (!userId) throw new Error("Not authenticated");
    await deleteProjectForUser(userId, data.projectId);
    return { ok: true };
  });
