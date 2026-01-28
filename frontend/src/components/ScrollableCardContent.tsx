import { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProgressiveBlur } from './ui/progressive-blur';

interface ScrollableCardContentProps {
    children: React.ReactNode;
    minHeight?: string;
    maxHeight?: string;
    onReachBottom?: () => void;
    fillParent?: boolean;
    showBlur?: boolean;
    blurHeight?: string;
}

const ScrollableCardContent = ({ children, minHeight = '28rem', maxHeight = '28rem', onReachBottom, fillParent = false, showBlur = false, blurHeight = '20%' }: ScrollableCardContentProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (scrollRef.current) {
                const { scrollHeight, clientHeight } = scrollRef.current;
                setHasOverflow(scrollHeight > clientHeight);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 20;
            setIsAtBottom(atBottom);

            if (atBottom && onReachBottom) {
                onReachBottom();
            }
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={`relative animate-fade-in ${fillParent ? 'flex-1 flex flex-col min-h-0' : ''}`}>
            {hasOverflow && !isAtBottom && (
                <button
                    onClick={scrollToBottom}
                    className="absolute right-0 top-0 z-10 flex items-center gap-1 rounded-full bg-muted/90 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <span><ChevronDown className="h-3 w-3" /></span>
                </button>
            )}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`scrollbar-hide overflow-y-auto ${fillParent ? 'flex-1' : ''}`}
                style={fillParent ? undefined : { minHeight, maxHeight }}
            >
                {children}
            </div>
            {showBlur && hasOverflow && !isAtBottom && (
                <ProgressiveBlur position="bottom" height={blurHeight} />
            )}
        </div>
    );
};

export default ScrollableCardContent;
