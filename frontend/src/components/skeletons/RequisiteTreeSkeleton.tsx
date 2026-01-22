import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RequisiteTreeSkeleton = () => {
    return (
        <Card className="shadow-earth">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-28" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-6 w-16" />
                    <div className="ml-4 space-y-2 border-l-2 border-border pl-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-6 w-28" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RequisiteTreeSkeleton;
