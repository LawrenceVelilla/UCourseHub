import { Loader2 } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface PageLayoutProps {
    children: ReactNode;
    isLoading?: boolean;
    loadingMessage?: string;
}

export default function PageLayout({ children, isLoading, loadingMessage }: PageLayoutProps) {
    const { isLoggingOut } = useAuth();
    const showLoader = isLoading || isLoggingOut;
    const message = isLoggingOut ? "Logging out..." : loadingMessage;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            {showLoader ? (
                <main className="container flex flex-1 items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        {message && (
                            <p className="text-sm font-medium text-muted-foreground">{message}</p>
                        )}
                    </div>
                </main>
            ) : (
                <main className="container flex-1 py-8">
                    {children}
                </main>
            )}
            <Footer />
        </div>
    );
}
