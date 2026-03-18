import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Calculator, Calendar, LogOut } from 'lucide-react';
import { Logo } from '../ui/logo';
import { useAuth } from '@/contexts/AuthContext';
import { handleSignOut } from '@/actions/sign-out';

const Header = () => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: '/', label: 'Search', icon: Search },
        { to: '/planner', label: 'Planner', icon: Calendar },
        { to: '/gpa', label: 'GPA Calculator', icon: Calculator },
    ];

    const onSignOut = () => {
        handleSignOut({ onSuccess: () => navigate('/') });
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <NavLink to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Logo />
                    </div>
                    <span className="font-serif text-xl font-semibold text-foreground">
                        UCourseHub
                    </span>
                </NavLink>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`
                                }
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden min-[50rem]:inline">{label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {isLoading ? (
                        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
                    ) : isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <NavLink to="/profile" className="transition-opacity hover:opacity-80">
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="h-8 w-8 rounded-full"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                        {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </div>
                                )}
                            </NavLink>
                            <button
                                onClick={onSignOut}
                                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden min-[1250px]:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <NavLink
                            to="/auth"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                        >
                            Login
                        </NavLink>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
