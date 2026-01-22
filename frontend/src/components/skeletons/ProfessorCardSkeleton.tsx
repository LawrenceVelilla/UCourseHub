import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ProfessorCardSkeleton = () => {
    return (
        <Card className="shadow-earth">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-6 w-12" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfessorCardSkeleton;
