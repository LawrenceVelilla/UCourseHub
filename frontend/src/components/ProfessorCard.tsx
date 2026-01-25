import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, GraduationCap } from 'lucide-react';
import type { Professor } from '@/types/course';
import ScrollableCardContent from './ScrollableCardContent';

interface ProfessorCardProps {
    professors: Professor[];
}

const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-accent text-accent-foreground';
    if (rating >= 4.0) return 'bg-secondary text-secondary-foreground';
    if (rating >= 3.5) return 'bg-muted text-muted-foreground';
    return 'bg-destructive/20 text-destructive';
};

const ProfessorCard = ({ professors }: ProfessorCardProps) => {
    return (
        <Card className="card-professor shadow-earth">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Professors This Semester
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                <ScrollableCardContent maxHeight="150px">
                    {professors.length > 0 ? (
                        <div className="space-y-3">
                            {professors.map((prof) => {
                                const content = (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <GraduationCap className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground group-hover:text-primary">
                                                    {prof.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{prof.semester}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">

                                            {prof.rating !== null ? (
                                                <Badge className={`${getRatingColor(prof.rating)} flex items-center gap-1`}>
                                                    <Star className="h-3 w-3" />
                                                    {prof.rating.toFixed(1)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    No rating
                                                </Badge>
                                            )}
                                            {prof.rmpLink && (
                                                <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                            )}
                                        </div>
                                    </>
                                );

                                return prof.rmpLink ? (
                                    <a
                                        key={`${prof.id}-${prof.term}-${prof.year}`}
                                        href={prof.rmpLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-all hover:border-primary/30 hover:bg-muted"
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    <div
                                        key={`${prof.id}-${prof.term}-${prof.year}`}
                                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                                    >
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">
                            No professor information available
                        </p>
                    )}
                </ScrollableCardContent>
            </CardContent>
        </Card>
    );
};

export default ProfessorCard;
