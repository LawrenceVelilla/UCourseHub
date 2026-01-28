import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, GraduationCap, Brain } from 'lucide-react';
import type { Professor } from '@/types/course';
import ScrollableCardContent from './ScrollableCardContent';

interface ProfessorCardProps {
    professors: Professor[];
}

const getRatingColor = (rating: number) => {
    if (rating >= 3.0) return 'bg-accent/20 text-accent';
    return 'bg-destructive/10 text-destructive/70';
};

const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 3.0) return 'bg-destructive/10 text-destructive/70';
    return 'bg-accent/20 text-accent';
};

const ProfessorCard = ({ professors }: ProfessorCardProps) => {
    return (
        <Card className="card-professor shadow-earth gap-2">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Professors
                </CardTitle>
                <CardDescription>
                    Professors Teaching this course this semester and their RateMyProfessor stats
                    <div className='flex items-center gap-2 mt-2'>
                        <Badge variant="outline" className="text-muted-foreground">
                            <Brain className="h-3 w-3" />
                            Difficulty
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                            <Star className="h-3 w-3" />
                            Rating
                        </Badge>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollableCardContent minHeight="140px" maxHeight="240px">
                    {professors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {professors.map((prof) => {
                                const content = (
                                    <>
                                        <div className="flex items-center gap-3 min-w-0">

                                            <div className="min-w-0 pl-5">
                                                <p className="font-medium text-foreground group-hover:text-primary truncate">
                                                    {prof.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{prof.semester}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {prof.difficulty !== null ? (
                                                <Badge className={`${getDifficultyColor(prof.difficulty)} flex items-center gap-1`}>
                                                    <Brain className="h-3 w-3" />
                                                    {prof.difficulty.toFixed(1)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    N/A
                                                </Badge>
                                            )}
                                            {prof.rating !== null ? (
                                                <Badge className={`${getRatingColor(prof.rating)} flex items-center gap-1`}>
                                                    <Star className="h-3 w-3" />
                                                    {prof.rating.toFixed(1)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    N/A
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
                                        className="group flex h-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-all hover:border-primary/30 hover:bg-muted"
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    <div
                                        key={`${prof.id}-${prof.term}-${prof.year}`}
                                        className="flex h-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                                    >
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">
                            No professor information available (Not in Database yet!)
                        </p>
                    )}
                </ScrollableCardContent>
                <section className='text-xs italic text-muted-foreground mt-2'>
                    Disclaimer: Take these scores with a grain of salt. Student experience varies depending on the the student and semester! A lower score does not necessarily mean a bad professor.
                </section>
            </CardContent>
        </Card>
    );
};

export default ProfessorCard;
