import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Calculator, Calendar, LogOut, User, Settings } from 'lucide-react';
import { Logo } from '../ui/logo';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: '/', label: 'Search', icon: Search },
        { to: '/planner', label: 'Planner', icon: Calendar },
        { to: '/gpa', label: 'GPA Calculator', icon: Calculator },
    ];

    const onSignOut = () => {
        logout(() => navigate('/'));
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer">
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
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
