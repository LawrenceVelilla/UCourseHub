import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Auth = () => {
    const [type, setType] = useState<"login" | "signup">("login");
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="container flex flex-1 items-center justify-center py-16">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="font-serif text-2xl">
                            {type === "signup" ? 'Create an account' : 'Welcome back'}
                        </CardTitle>
                        <CardDescription>
                            {type === "signup"
                                ? 'Sign up to save courses and plan your schedule'
                                : 'Sign in to your UCourseHub account'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuthForm
                            type={type}
                            onToggle={() => setType(t => t === "login" ? "signup" : "login")}
                        />
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default Auth;
