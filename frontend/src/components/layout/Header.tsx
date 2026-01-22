import { NavLink } from 'react-router-dom';
import { BookOpen, Search, Calculator, Calendar } from 'lucide-react';

const Header = () => {
    const navItems = [
        { to: '/', label: 'Search', icon: Search },
        { to: '/planner', label: 'Planner', icon: Calendar },
        { to: '/gpa', label: 'GPA Calculator', icon: Calculator },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <NavLink to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-serif text-xl font-semibold text-foreground">
                        UCoursePlanner
                    </span>
                </NavLink>

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
                            <span className="hidden sm:inline">{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default Header;
