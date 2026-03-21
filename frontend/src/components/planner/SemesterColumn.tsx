import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CourseCard from "./CourseCard";
import type { PlannerCourse } from "@/stores/planner-store";

interface SemesterColumnProps {
    droppableId: string;
    title: string;
    courses: PlannerCourse[];
    onRemove: (uniqueId: string) => void;
}

export default function SemesterColumn({ droppableId, title, courses, onRemove }: SemesterColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });
    const itemIds = courses.map((c) => c.uniqueId);

    return (
        <div className="min-w-[180px] flex-1">
            <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
            </div>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div
                    ref={setNodeRef}
                    className={`min-h-[110px] space-y-2 rounded-xl border-2 border-dashed p-3 transition-colors ${isOver
                            ? "border-primary bg-primary/5"
                            : "border-border bg-[var(--sand)]/25"
                        }`}
                >
                    {courses.map((course) => (
                        <CourseCard key={course.uniqueId} course={course} onRemove={onRemove} />
                    ))}
                    {courses.length === 0 && !isOver && (
                        <p className="py-6 text-center text-xs text-muted-foreground/50">
                            Drop courses here
                        </p>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
