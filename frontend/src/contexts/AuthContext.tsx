import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

interface AuthContextType {
    user: { id: string; name: string; email: string; image?: string | null } | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, isPending } = useSession();

    const value = useMemo<AuthContextType>(() => ({
        user: session?.user ?? null,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
    }), [session?.user, isPending]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
