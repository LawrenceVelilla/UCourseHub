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

export function signInWithGoogle() {
    signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/auth",
    });
}
