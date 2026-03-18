import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PlanList from '@/components/profile/PlanList';
import CourseLog from '@/components/profile/CourseLog';

const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="container flex-1 py-8">
                {/* User Info */}
                <div className="mb-8 flex items-center gap-4">
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt={user.name}
                            className="h-16 w-16 rounded-full"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div>
                        <h1 className="font-serif text-2xl font-bold">{user?.name}</h1>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                {/* Dashboard sections */}
                <div className="space-y-10">
                    <PlanList />
                    <CourseLog />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Profile;
