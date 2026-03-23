import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CourseSuggestion {
    courseCode: string;
    title: string;
}

interface CourseSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const CourseSearch = ({ onSearch, placeholder = "Search courses (e.g., CMPUT 200)" }: CourseSearchProps) => {
    const [query, setQuery] = useState('');
    const [allCourses, setAllCourses] = useState<CourseSuggestion[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseSuggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Fetch full course list once on first focus
    const fetchCourses = async () => {
        if (allCourses.length > 0 || isLoadingCourses) return;
        setIsLoadingCourses(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/courses/list`, { credentials: "include" });
            if (!res.ok) return;
            const data: CourseSuggestion[] = await res.json();
            setAllCourses(data);
        } catch {
            // Autocomplete is a nice-to-have — search still works via Enter
        } finally {
            setIsLoadingCourses(false);
        }
    };

    // Filter on every keystroke (instant for client-side data)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = e.target.value;
        setQuery(searchTerm);

        if (!searchTerm.trim() || allCourses.length === 0) {
            setFilteredCourses([]);
            setIsOpen(false);
            return;
        }

        const q = searchTerm.toUpperCase().trim();
        const filtered = allCourses
            .filter(c => c.courseCode.includes(q) || c.title.toUpperCase().includes(q))
            .slice(0, 8);

        setFilteredCourses(filtered);
        setActiveIndex(-1);
        setIsOpen(filtered.length > 0);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const item = listRef.current.children[activeIndex] as HTMLElement;
        item?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const selectCourse = (courseCode: string) => {
        setQuery(courseCode);
        setIsOpen(false);
        onSearch(courseCode);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeIndex >= 0 && filteredCourses[activeIndex]) {
            selectCourse(filteredCourses[activeIndex].courseCode);
        } else {
            onSearch(query);
        }
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || filteredCourses.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % filteredCourses.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(i => (i <= 0 ? filteredCourses.length - 1 : i - 1));
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl">
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={fetchCourses}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-10 pr-10 shadow-earth transition-shadow focus:shadow-earth-lg"
                    autoComplete="off"
                />
                {isLoadingCourses && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </form>

            {isOpen && filteredCourses.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-earth-lg"
                >
                    {filteredCourses.map((course, i) => (
                        <li
                            key={course.courseCode}
                            onMouseDown={() => selectCourse(course.courseCode)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                                i === activeIndex ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                        >
                            <span className="font-medium">{course.courseCode}</span>
                            <span className="ml-3 truncate text-muted-foreground">{course.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CourseSearch;
