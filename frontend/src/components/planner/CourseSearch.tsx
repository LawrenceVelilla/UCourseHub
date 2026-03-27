import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { PlannerCourse } from "@/stores/planner-store";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface CourseSearchProps {
    onAddCourse: (course: PlannerCourse) => void;
}

export default function CourseSearch({ onAddCourse }: CourseSearchProps) {
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim().toUpperCase();
        if (!trimmed) return;

        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/v1/courses/${encodeURIComponent(trimmed)}`,
                { credentials: "include" },
            );
            if (!res.ok) throw new Error("Not found");

            const data = await res.json();
            const course = data[0];
            if (!course) throw new Error("Not found");

            onAddCourse({
                uniqueId: `${course.courseCode}-${Date.now()}`,
                code: course.courseCode,
                title: course.title,
                credits: course.units?.credits,
            });
            setQuery("");
        } catch {
            setError(`No course found for "${trimmed}"`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    placeholder="Search by course code (e.g. CMPUT 174) and press Enter"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setError(""); }}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-10 text-sm text-foreground outline-none shadow-earth transition-colors focus:border-primary"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </form>

            {error && (
                <p className="mt-2 py-1 text-center text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
