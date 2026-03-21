import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/components/layout/PageLayout';
import PlanList from '@/components/profile/PlanList';
import CourseLog from '@/components/profile/CourseLog';

const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    if (!isLoading && !isAuthenticated) return <Navigate to="/auth" replace />;

    const handleEditName = () => {
        setEditName(user?.name ?? '');
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === user?.name) {
            setIsEditingName(false);
            return;
        }
        setIsSavingName(true);
        try {
            await updateUser({ name: trimmed });
            setIsEditingName(false);
        } catch (err) {
            console.error('Failed to update name:', err);
        } finally {
            setIsSavingName(false);
        }
    };

    return (
        <PageLayout isLoading={isLoading} loadingMessage="Loading profile...">
            {/* Banner */}
            <div className="relative mb-20">
                <div className="h-48 rounded-2xl bg-gradient-to-r from-[var(--walnut)] via-[var(--terracotta)] to-[var(--primary)] sm:h-56" />

                {/* Avatar overlapping banner */}
                <div className="absolute -bottom-14 left-6 sm:left-8">
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt={user.name}
                            className="h-28 w-28 rounded-full border-4 border-background shadow-earth-lg"
                        />
                    ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-background bg-primary text-4xl font-bold text-primary-foreground shadow-earth-lg">
                            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                    )}
                </div>
            </div>

            {/* User info row */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9 max-w-xs font-serif text-2xl font-bold"
                                autoFocus
                                maxLength={50}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') setIsEditingName(false);
                                }}
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveName}
                                disabled={isSavingName}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingName(false)}
                                disabled={isSavingName}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="font-serif text-2xl font-bold">{user?.name}</h1>
                            <button
                                onClick={handleEditName}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
            </div>

            {/* Dashboard sections */}
            <div className="space-y-10">
                <PlanList />
                <CourseLog />
            </div>
        </PageLayout>
    );
};

export default Profile;
