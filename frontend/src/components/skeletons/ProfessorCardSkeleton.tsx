import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollableCardContent from '../ScrollableCardContent';

const ProfessorCardSkeleton = () => {
    return (
        <Card className="card-professor shadow-earth">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <div className="mt-2">
                    <Skeleton className="h-3 w-full max-w-md" />
                    <div className="mt-2 flex items-center gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <ScrollableCardContent maxHeight="100px">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex h-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="min-w-0 space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-4 w-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollableCardContent>
            </CardContent>
        </Card>
    );
};

export default ProfessorCardSkeleton;
