import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_POINTS } from '@/types/course';
import { Plus, Trash2, Calculator, Trophy } from 'lucide-react';

const GpaCalculator = () => {
    const [entries, setEntries] = useState<any[]>([
        { id: '1', courseName: '', credits: 3, grade: '' },
    ]);

    const addEntry = () => {
        setEntries([
            ...entries,
            { id: Date.now().toString(), courseName: '', credits: 3, grade: '' },
        ]);
    };

    const removeEntry = (id: string) => {
        if (entries.length > 1) {
            setEntries(entries.filter((e) => e.id !== id));
        }
    };

    const updateEntry = (id: string, field: keyof any, value: string | number) => {
        setEntries(
            entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
        );
    };

    const calculateGPA = () => {
        const validEntries = entries.filter((e) => e.grade && e.credits > 0);
        if (validEntries.length === 0) return null;

        const totalPoints = validEntries.reduce(
            (sum, e) => sum + GRADE_POINTS[e.grade] * e.credits,
            0
        );
        const totalCredits = validEntries.reduce((sum, e) => sum + e.credits, 0);

        return (totalPoints / totalCredits).toFixed(2);
    };

    const gpa = calculateGPA();

    const getGpaColor = (gpa: number) => {
        if (gpa >= 3.7) return 'text-accent';
        if (gpa >= 3.0) return 'text-primary';
        if (gpa >= 2.0) return 'text-muted-foreground';
        return 'text-destructive';
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8">
                <section className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        GPA Calculator
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Calculate your cumulative GPA based on the University of Alberta 4.0 scale
                    </p>
                </section>

                <div className="mx-auto max-w-2xl space-y-6">
                    {/* Grade Entries */}
                    <Card className="shadow-earth">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg">
                                <Calculator className="h-5 w-5 text-primary" />
                                Course Grades
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
                                            Your GPA
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
            </main>
        </div>
    );
};

export default GpaCalculator;
