import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, GitBranch, Link2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { RequirementCondition } from '@/types/course';
import { transformToTree, type TreeNode } from '@/lib/requisite-tree';
import ScrollableCardContent from './ScrollableCardContent';

interface RequisiteTreeProps {
    requisites: RequirementCondition | null | undefined;
    title: 'Prerequisites' | 'Corequisites';
}

interface TreeNodeRendererProps {
    node: TreeNode;
    depth?: number;
    onCourseClick: (courseCode: string) => void;
}

const TreeNodeRenderer = ({ node, depth = 0, onCourseClick }: TreeNodeRendererProps) => {
    if (node.type === 'operator') {
        const operatorLabel = node.label === 'AND' ? 'All of:' : 'One of:';

        return (
            <div className={`${depth > 0 ? 'ml-4 border-l-2 border-border pl-4' : ''}`}>
                <code className="mb-2 inline-block rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {operatorLabel}
                </code>
                <div className="space-y-2">
                    {node.children?.map((child) => (
                        <TreeNodeRenderer
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onCourseClick={onCourseClick}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (node.type === 'course' && node.courseCode) {
        return (
            <div className={`flex items-center gap-2 ${depth > 0 ? 'ml-4 border-l-2 border-border pl-4' : ''}`}>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge
                    variant="outline"
                    className="cursor-pointer border-primary/30 font-mono text-primary transition-colors hover:bg-primary/10 hover:border-primary"
                    onClick={() => onCourseClick(node.courseCode!)}
                >
                    {node.label}
                </Badge>
            </div>
        );
    }

    if (node.type === 'wildcard') {
        return (
            <div className={`flex items-center gap-2 ${depth > 0 ? 'ml-4 border-l-2 border-border pl-4' : ''}`}>
                <Sparkles className="h-3 w-3 text-amber-500" />
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/5 font-mono text-amber-700 dark:text-amber-400"
                >
                    {node.label}
                </Badge>
            </div>
        );
    }

    return null;
};

const RequisiteTree = ({ requisites, title }: RequisiteTreeProps) => {
    const [, setSearchParams] = useSearchParams();

    const handleCourseClick = (courseCode: string) => {
        setSearchParams({ course: courseCode });
    };

    const Icon = title === 'Prerequisites' ? GitBranch : Link2;

    // Transform the requirement condition to a tree structure
    const treeNodes = requisites ? transformToTree(requisites) : [];

    // Check if the tree is empty (no real requirements)
    const hasRequirements = treeNodes.length > 0;

    return (
        <Card className="card-requisite shadow-earth">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollableCardContent minHeight="5rem" maxHeight="18rem" showBlur>
                    {hasRequirements ? (
                        <div className="space-y-2">
                            {treeNodes.map((node) => (
                                <TreeNodeRenderer
                                    key={node.id}
                                    node={node}
                                    onCourseClick={handleCourseClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">
                            No {title.toLowerCase()} required
                        </p>
                    )}
                </ScrollableCardContent>
            </CardContent>
        </Card>
    );
};

export default RequisiteTree;
