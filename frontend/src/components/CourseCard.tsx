import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FinalCourseDetails } from '@/types/course';

interface CourseCardProps {
    course: FinalCourseDetails;
}

const CourseCard = ({ course }: CourseCardProps) => {
    const keywords = course.keywords ?? [];
    const credits = course.units?.credits;
    const term = course.units?.term;

    return (
        <Card className="animate-fade-in shadow-earth transition-all hover:shadow-earth-lg">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-foreground">
                            {course.courseCode}
                        </h2>
                        <p className="mt-1 text-lg text-muted-foreground">{course.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
                        {credits && (
                            <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{credits} Credits</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword) => (
                            <Badge
                                key={keyword}
                                variant="secondary"
                                className="bg-accent/10 text-accent hover:bg-accent/20"
                            >
                                {keyword}
                            </Badge>
                        ))}
                    </div>
                )}

                <p className="text-sm leading-relaxed text-foreground/80">
                    {course.description}
                </p>

                {term && (
                    <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />                
                        
                        <span>Term: {term}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseCard;
