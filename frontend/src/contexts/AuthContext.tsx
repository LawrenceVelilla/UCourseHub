import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { handleSignOut } from "@/actions/sign-out";

interface AuthContextType {
    user: { id: string; name: string; email: string; image?: string | null } | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isLoggingOut: boolean;
    logout: (onSuccess?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isLoggingOut: false,
    logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, isPending } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const logout = useCallback(async (onSuccess?: () => void) => {
        setIsLoggingOut(true);
        await handleSignOut({ onSuccess });
        setIsLoggingOut(false);
    }, []);

    const value = useMemo<AuthContextType>(() => ({
        user: session?.user ?? null,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
        isLoggingOut,
        logout,
    }), [session?.user, isPending, isLoggingOut, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
