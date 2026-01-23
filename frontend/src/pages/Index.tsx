import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import CourseSearch from '@/components/CourseSearch';
import CourseCard from '@/components/CourseCard';
import RequisiteTree from '@/components/RequisiteTree';
import NeededByCard from '@/components/NeededByCard';
import ProfessorCard from '@/components/ProfessorCard';
import RedditDiscussions from '@/components/RedditDiscussions';
import {
    CourseCardSkeleton,
    RequisiteTreeSkeleton,
    NeededByCardSkeleton,
    ProfessorCardSkeleton,
} from '@/components/skeletons';
import { useCourse, useDependents, useRedditDiscussions, useProfessors } from '@/hooks/use-course';

const Index = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const courseCode = searchParams.get('course');

    const { data: course, isLoading: isCourseLoading, error: courseError } = useCourse(courseCode);

    const { data: dependents, isLoading: isDependentsLoading, error: dependentsError } = useDependents(courseCode);

    const { data: discussions } = useRedditDiscussions(course?.id ?? null);

    const { data: professors } = useProfessors(course?.id ?? null);

    useEffect(() => {
        if (courseError) {
            toast.error('Failed to load course', {
                description: courseError.message,
            });
        }
        if (dependentsError) {
            toast.error('Failed to load dependents', {
                description: dependentsError.message,
            });
        }
    }, [courseError, dependentsError]);

    const handleSearch = (query: string) => {
        const normalizedQuery = query.toUpperCase().trim();
        if (normalizedQuery) {
            setSearchParams({ course: normalizedQuery });
        } else {
            setSearchParams({});
        }
    };

    const isLoading = isCourseLoading || isDependentsLoading;
    const hasError = courseError || dependentsError;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8">
                <section className="mb-12 text-center">
                    <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
                        UCoursePlanner
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                        Plan your University of Alberta courses with ease. Search courses, check prerequisites, and build your academic path.
                    </p>
                </section>

                <section className="mb-10 flex justify-center">
                    <CourseSearch onSearch={handleSearch} />
                </section>

                {courseCode ? (
                    <div className="animate-fade-in space-y-6">
                        <div className="grid gap-6 lg:grid-cols-12">
                            <aside className="lg:col-span-3">
                                <RedditDiscussions discussions={discussions ?? []} />
                            </aside>

                            <div className="space-y-6 lg:col-span-9">
                                {isCourseLoading ? (
                                    <>
                                        <CourseCardSkeleton />
                                        <ProfessorCardSkeleton />
                                    </>
                                ) : course ? (
                                    <>
                                        <CourseCard course={course} />
                                        <ProfessorCard professors={professors ?? []} />
                                    </>
                                ) : hasError ? (
                                    <CourseCardSkeleton />
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-destructive/50 bg-destructive/5 p-8 text-center">
                                        <p className="text-destructive">
                                            Course "{courseCode}" not found
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {isLoading ? (
                                <>
                                    <RequisiteTreeSkeleton />
                                    <NeededByCardSkeleton />
                                    <RequisiteTreeSkeleton />
                                </>
                            ) : (
                                <>
                                    <RequisiteTree
                                        requisites={course?.requirements?.prerequisites}
                                        title="Prerequisites"
                                    />
                                    <NeededByCard
                                        prereqDependents={dependents?.prereqDependents ?? []}
                                        coreqDependents={dependents?.coreqDependents ?? []}
                                    />
                                    <RequisiteTree
                                        requisites={course?.requirements?.corequisites}
                                        title="Corequisites"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Search className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                            Search for a Course
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            Enter a course code like "CMPUT 200" to view details, prerequisites, and more.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {['CMPUT 174', 'CMPUT 200', 'CMPUT 204', 'MATH 125'].map((code) => (
                                <button
                                    key={code}
                                    onClick={() => handleSearch(code)}
                                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                                >
                                    {code}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Index;
