import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { CourseDependent } from '@/hooks/use-course';
import ScrollableCardContent from './ScrollableCardContent';

interface NeededByCardProps {
    prereqDependents: CourseDependent[];
    coreqDependents: CourseDependent[];
}

interface DependentListProps {
    title: string;
    dependents: CourseDependent[];
    onCourseClick: (courseCode: string) => void;
    variant: 'prereq' | 'coreq';
}

const DependentList = ({ title, dependents, onCourseClick, variant }: DependentListProps) => {
    if (dependents.length === 0) return null;

    const badgeClass = variant === 'prereq'
        ? 'border-accent/40 text-accent'
        : 'border-secondary text-secondary-foreground';

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {dependents.map((course) => (
                <div
                    key={course.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
                    onClick={() => onCourseClick(course.courseCode)}
                >
                    <Badge
                        variant="outline"
                        className={`shrink-0 font-mono ${badgeClass}`}
                    >
                        {course.courseCode}
                    </Badge>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground/80">{course.title}</span>
                </div>
            ))}
        </div>
    );
};

const NeededByCard = ({ prereqDependents, coreqDependents }: NeededByCardProps) => {
    const [, setSearchParams] = useSearchParams();

    const handleCourseClick = (courseCode: string) => {
        setSearchParams({ course: courseCode });
    };

    const hasAnyDependents = prereqDependents.length > 0 || coreqDependents.length > 0;

    return (
        <Card className="card-needed-by shadow-earth">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Needed By
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollableCardContent maxHeight="18rem" minHeight="5rem" showBlur>
                    {hasAnyDependents ? (
                        <div className="space-y-4">
                            <DependentList
                                title="A Prerequisite of"
                                dependents={prereqDependents}
                                onCourseClick={handleCourseClick}
                                variant="prereq"
                            />
                            <DependentList
                                title="A Corequisite of"
                                dependents={coreqDependents}
                                onCourseClick={handleCourseClick}
                                variant="coreq"
                            />
                        </div>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">
                            Not required by any course
                        </p>
                    )}
                </ScrollableCardContent>
            </CardContent>
        </Card>
    );
};

export default NeededByCard;
