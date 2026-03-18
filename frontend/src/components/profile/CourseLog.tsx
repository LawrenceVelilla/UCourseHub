import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserCourses, useAddUserCourse, useDeleteUserCourse } from '@/hooks/use-user-courses';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, BookOpen } from 'lucide-react';

const TERMS = ['fall', 'winter', 'spring'] as const;
const CURRENT_YEAR = new Date().getFullYear();

export default function CourseLog() {
    const { data: courses, isLoading } = useUserCourses();
    const addCourse = useAddUserCourse();
    const deleteCourse = useDeleteUserCourse();
    const [isAdding, setIsAdding] = useState(false);
    const [courseCode, setCourseCode] = useState('');
    const [term, setTerm] = useState<string>('fall');
    const [year, setYear] = useState(CURRENT_YEAR);
    const [grade, setGrade] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseCode.trim()) return;
        await addCourse.mutateAsync({
            courseCode: courseCode.trim(),
            term,
            year,
            grade: grade || undefined,
        });
        setCourseCode('');
        setGrade('');
        setIsAdding(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    // Group courses by year and term
    const grouped = (courses ?? []).reduce<Record<string, typeof courses>>((acc, c) => {
        const key = `${c.term.charAt(0).toUpperCase() + c.term.slice(1)} ${c.year}`;
        if (!acc[key]) acc[key] = [];
        acc[key]!.push(c);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">My Courses</h2>
                {!isAdding && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Course
                    </Button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-border p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Input
                            placeholder="Course code (e.g. CMPUT 174)"
                            value={courseCode}
                            onChange={e => setCourseCode(e.target.value)}
                            autoFocus
                            className="col-span-2 sm:col-span-1"
                        />
                        <select
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {TERMS.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                        <Input
                            type="number"
                            placeholder="Year"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value) || CURRENT_YEAR)}
                            min={2000}
                            max={2100}
                        />
                        <Input
                            placeholder="Grade (optional)"
                            value={grade}
                            onChange={e => setGrade(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={addCourse.isPending || !courseCode.trim()}>
                            {addCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {Object.keys(grouped).length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([label, items]) => (
                        <div key={label}>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label}</h3>
                            <div className="space-y-2">
                                {items!.map(c => (
                                    <Card key={c.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                            <span className="font-mono text-sm font-medium">{c.courseCode}</span>
                                            {c.grade && (
                                                <Badge variant="outline">{c.grade}</Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => deleteCourse.mutate(c.courseCode)}
                                        >
                                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : !isAdding ? (
                <p className="text-sm text-muted-foreground">No courses logged yet. Add courses you've taken to track your progress.</p>
            ) : null}
        </div>
    );
}
