import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_POINTS } from '@/types/course';
import { Plus, Trash2, Calculator, Trophy } from 'lucide-react';

type Mode = 'semester' | 'cumulative';

const createEntry = () => ({
    id: Date.now().toString() + Math.random(),
    courseName: '',
    credits: 3,
    grade: '',
});

const GpaCalculator = () => {
    const [mode, setMode] = useState<Mode>('semester');
    const [entries, setEntries] = useState(() =>
        Array.from({ length: 5 }, createEntry)
    );

    // Cumulative mode state
    const [priorGpa, setPriorGpa] = useState('');
    const [priorCredits, setPriorCredits] = useState('');

    const addEntry = () => {
        setEntries([...entries, createEntry()]);
    };

    const removeEntry = (id: string) => {
        if (entries.length > 1) {
            setEntries(entries.filter((e) => e.id !== id));
        }
    };

    const updateEntry = (id: string, field: string, value: string | number) => {
        setEntries(
            entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
        );
    };

    const calculateGPA = () => {
        const validEntries = entries.filter((e) => e.grade && e.credits > 0);
        if (validEntries.length === 0) return null;

        const semesterPoints = validEntries.reduce(
            (sum, e) => sum + GRADE_POINTS[e.grade] * e.credits,
            0
        );
        const semesterCredits = validEntries.reduce((sum, e) => sum + e.credits, 0);

        if (mode === 'cumulative' && priorGpa && priorCredits) {
            const pGpa = parseFloat(priorGpa);
            const pCredits = parseFloat(priorCredits);
            if (pGpa >= 0 && pCredits > 0) {
                const totalPoints = semesterPoints + pGpa * pCredits;
                const totalCredits = semesterCredits + pCredits;
                return (totalPoints / totalCredits).toFixed(2);
            }
        }

        return (semesterPoints / semesterCredits).toFixed(2);
    };

    const gpa = calculateGPA();

    const getGpaColor = (gpa: number) => {
        if (gpa >= 3.7) return 'text-accent';
        if (gpa >= 3.0) return 'text-primary';
        if (gpa >= 2.0) return 'text-muted-foreground';
        return 'text-destructive';
    };

    return (
        <PageLayout>
                <section className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        GPA Calculator
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Calculate your GPA based on the University of Alberta 4.0 scale
                    </p>
                </section>

                <div className="mx-auto max-w-2xl space-y-6">
                    {/* Mode toggle */}
                    <div className="flex justify-center gap-2">
                        <Button
                            variant={mode === 'semester' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('semester')}
                        >
                            Semester GPA
                        </Button>
                        <Button
                            variant={mode === 'cumulative' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('cumulative')}
                        >
                            Cumulative GPA
                        </Button>
                    </div>

                    {/* Prior GPA input for cumulative mode */}
                    {mode === 'cumulative' && (
                        <Card className="shadow-earth border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="font-serif text-lg">
                                    Prior Academic Record
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-sm text-muted-foreground">Current GPA</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={4}
                                            step={0.01}
                                            placeholder="e.g. 3.50"
                                            value={priorGpa}
                                            onChange={(e) => setPriorGpa(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="mb-1 block text-sm text-muted-foreground">Total Credits</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 60"
                                            value={priorCredits}
                                            onChange={(e) => setPriorCredits(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Enter your existing GPA and total credits, then add this semester's courses below.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Grade Entries */}
                    <Card className="shadow-earth">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg">
                                <Calculator className="h-5 w-5 text-primary" />
                                {mode === 'cumulative' ? 'This Semester' : 'Course Grades'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {entries.map((entry, idx) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center gap-3 animate-fade-in"
                                >
                                    <span className="w-6 text-center text-sm text-muted-foreground">
                                        {idx + 1}.
                                    </span>
                                    <Input
                                        placeholder="Course name (optional)"
                                        value={entry.courseName}
                                        onChange={(e) => updateEntry(entry.id, 'courseName', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min={1}
                                        max={9}
                                        placeholder="Credits"
                                        value={entry.credits}
                                        onChange={(e) => updateEntry(entry.id, 'credits', parseInt(e.target.value) || 0)}
                                        className="w-20"
                                    />
                                    <Select
                                        value={entry.grade}
                                        onValueChange={(value: string) => updateEntry(entry.id, 'grade', value)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(GRADE_POINTS).map((grade) => (
                                                <SelectItem key={grade} value={grade}>
                                                    {grade}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEntry(entry.id)}
                                        disabled={entries.length === 1}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                onClick={addEntry}
                                className="mt-4 w-full border-dashed"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Course
                            </Button>
                        </CardContent>
                    </Card>

                    {/* GPA Result */}
                    <Card className={`shadow-earth-lg transition-all ${gpa ? 'border-primary/30' : ''}`}>
                        <CardContent className="py-8 text-center">
                            {gpa ? (
                                <div className="animate-fade-in">
                                    <div className="mb-2 flex items-center justify-center gap-2">
                                        <Trophy className={`h-6 w-6 ${getGpaColor(parseFloat(gpa))}`} />
                                        <span className="text-sm uppercase tracking-wider text-muted-foreground">
                                            {mode === 'cumulative' && priorGpa && priorCredits ? 'Cumulative GPA' : 'Your GPA'}
                                        </span>
                                    </div>
                                    <p className={`font-serif text-6xl font-bold ${getGpaColor(parseFloat(gpa))}`}>
                                        {gpa}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        out of 4.0
                                    </p>
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    <Calculator className="mx-auto mb-3 h-10 w-10" />
                                    <p>Enter your grades above to calculate your GPA</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Grade Scale Reference */}
                    <Card className="shadow-earth">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-serif text-lg">Grade Scale Reference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                {Object.entries(GRADE_POINTS).map(([grade, points]) => (
                                    <div
                                        key={grade}
                                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                                    >
                                        <span className="font-medium">{grade}</span>
                                        <span className="text-muted-foreground">{points.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
        </PageLayout>
    );
};

export default GpaCalculator;
