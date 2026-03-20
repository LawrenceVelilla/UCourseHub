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
            {isLoggingOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm font-medium text-muted-foreground">Logging out...</p>
                    </div>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
