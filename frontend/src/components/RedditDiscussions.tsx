import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, MessageCircle, ArrowUp, Loader2 } from 'lucide-react';
import ScrollableCardContent from './ScrollableCardContent';

interface RedditDiscussionsProps {
    discussions: any[];
    fetchNextPage?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    isLoading?: boolean;
}

const RedditDiscussions = ({
    discussions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
}: RedditDiscussionsProps) => {
    const handleReachBottom = () => {
        if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
        }
    };
    return (
        <Card className="card-reddit shadow-earth">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <svg
                        className="h-5 w-5 text-primary"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                    </svg>
                    Reddit Discussions
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : discussions.length > 0 ? (
                    <ScrollableCardContent maxHeight="28rem" onReachBottom={handleReachBottom}>
                        <div className="space-y-3">
                            {discussions.map((discussion, idx) => (
                                <a
                                    key={discussion.id || idx}
                                    href={discussion.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block rounded-lg border border-border bg-muted/30 p-3 transition-all hover:border-primary/30 hover:bg-muted"
                                >
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <h4 className="font-medium text-foreground group-hover:text-primary min-w-0 break-words">
                                            {discussion.title}
                                        </h4>
                                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                        {discussion.preview}
                                    </p>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <ArrowUp className="h-3 w-3" />
                                            {discussion.upvotes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />
                                            {discussion.comments}
                                        </span>
                                    </div>
                                </a>
                            ))}
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </ScrollableCardContent>
                ) : (
                    <p className="text-sm italic text-muted-foreground">
                        No discussions found for this course
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default RedditDiscussions;
