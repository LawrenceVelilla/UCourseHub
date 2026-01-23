import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';

interface CorequisitesCardProps {
    corequisites: string[];
}

const CorequisitesCard = ({ corequisites }: CorequisitesCardProps) => {
    return (
        <Card className="shadow-earth">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                    Corequisites
                </CardTitle>
            </CardHeader>
            <CardContent>
                {corequisites.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {corequisites.map((course) => (
                            <Badge
                                key={course}
                                variant="outline"
                                className="border-secondary font-mono"
                            >
                                {course}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm italic text-muted-foreground">
                        No corequisites required
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default CorequisitesCard;
