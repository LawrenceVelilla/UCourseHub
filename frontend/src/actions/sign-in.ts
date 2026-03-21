import { signIn } from "@/lib/auth-client";

export async function signInWithEmail(
    email: string,
    password: string,
    callbacks?: {
        onSuccess?: () => void;
        onError?: (error: string) => void;
    }
) {
    await signIn.email({
        email,
        password,
    }, {
        onSuccess: () => callbacks?.onSuccess?.(),
        onError: (ctx) => callbacks?.onError?.(ctx.error.message),
    });
}

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export function signInWithGoogle() {
    signIn.social({
        provider: "google",
        callbackURL: FRONTEND_URL,
        errorCallbackURL: `${FRONTEND_URL}/auth`,
    });
}
