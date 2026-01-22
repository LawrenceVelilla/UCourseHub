import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const NeededByCardSkeleton = () => {
    return (
        <Card className="shadow-earth">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <div className="space-y-2">
                            <Skeleton className="h-14 w-full rounded-lg" />
                            <Skeleton className="h-14 w-full rounded-lg" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NeededByCardSkeleton;
