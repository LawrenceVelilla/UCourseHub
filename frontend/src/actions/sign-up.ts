import { signUp } from "@/lib/auth-client";

export async function signUpWithEmail(
    email: string,
    password: string,
    name: string,
    callbacks?: {
        onSuccess?: () => void;
        onError?: (error: string) => void;
    }
) {
    await signUp.email({
        email,
        password,
        name,
    }, {
        onSuccess: () => callbacks?.onSuccess?.(),
        onError: (ctx) => callbacks?.onError?.(ctx.error.message),
    });
}
