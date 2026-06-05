import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loginFn, registerFn, logoutFn, getMe } from "@/lib/api/server-fns";

export type AuthUser = { id: number; username: string; displayName: string };

type AuthCtx = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = async (email: string, password: string) => {
    const res = await loginFn({ data: { email, password } });
    qc.setQueryData(["me"], res.user);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await registerFn({ data: { email, password, displayName } });
    qc.setQueryData(["me"], res.user);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const logout = async () => {
    const res = await logoutFn();
    qc.setQueryData(["me"], null);
    qc.removeQueries({ queryKey: ["projects"] });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
