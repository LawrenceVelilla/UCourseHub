import { signOut } from "@/lib/auth-client";

export async function handleSignOut(callbacks?: {
    onSuccess?: () => void;
}) {
    await signOut({
        fetchOptions: {
            onSuccess: () => callbacks?.onSuccess?.(),
        },
    });
}
