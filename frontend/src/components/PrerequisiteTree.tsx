import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, GitBranch } from 'lucide-react';

interface PrerequisiteTreeProps {
    prerequisites: any | null;
}

const RenderGroup = ({ group, depth = 0 }: { group: any; depth?: number }) => {
    const label = group.type === 'one_of' ? 'One of:' : 'All of:';

    return (
        <div className={`${depth > 0 ? 'ml-4 border-l-2 border-border pl-4' : ''}`}>
            <code className="mb-2 inline-block rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                {label}
            </code>
            <div className="space-y-2">
                {group.courses?.map((course: any) => (
                    <div key={course} className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="border-primary/30 font-mono text-primary">
                            {course}
                        </Badge>
                    </div>
                ))}
                {group.groups?.map((subGroup: any, idx: number) => (
                    <RenderGroup key={idx} group={subGroup} depth={depth + 1} />
                ))}
            </div>
        </div>
    );
};

const PrerequisiteTree = ({ prerequisites }: PrerequisiteTreeProps) => {
    return (
        <Card className="shadow-earth ">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Prerequisites
                </CardTitle>
            </CardHeader>
            <CardContent>
                {prerequisites ? (
                    <RenderGroup group={prerequisites} />
                ) : (
                    <p className="text-sm italic text-muted-foreground">
                        No prerequisites required or No data available.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default PrerequisiteTree;
