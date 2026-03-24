import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import type { PlannerCourse } from "@/stores/planner-store";

interface CourseCardProps {
    course: PlannerCourse;
    onRemove: (uniqueId: string) => void;
    compact?: boolean;
}

export default function CourseCard({ course, onRemove, compact }: CourseCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: course.uniqueId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
    };

    if (compact) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={`group inline-flex cursor-grab items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-shadow ${
                    isDragging
                        ? "border-primary bg-[var(--cream)] shadow-earth-lg"
                        : "border-border bg-card"
                }`}
            >
                <span className="font-semibold text-foreground">{course.code}</span>
                {course.credits != null && (
                    <span className="text-muted-foreground">({course.credits})</span>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(course.uniqueId); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2.5 transition-shadow ${
                isDragging
                    ? "border-primary bg-[var(--cream)] shadow-earth-lg"
                    : "border-border bg-card"
            }`}
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{course.code}</p>
                <p className="truncate text-xs text-muted-foreground">{course.title}</p>
            </div>
            {course.credits != null && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {course.credits} cr
                </span>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(course.uniqueId); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
