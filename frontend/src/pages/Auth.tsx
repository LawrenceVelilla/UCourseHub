import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';

const Auth = () => {
    const [type, setType] = useState<"login" | "signup">("login");
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <PageLayout>
            <div className="flex flex-1 items-center justify-center py-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="font-serif text-2xl">
                            {type === "signup" ? 'Create an account' : 'Welcome back'}
                        </CardTitle>
                        <CardDescription>
                            {type === "signup"
                                ? 'Sign up to save courses and plan your schedule'
                                : 'Login to your UCourseHub account'
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
            </div>
        </PageLayout>
    );
};

export default Auth;
