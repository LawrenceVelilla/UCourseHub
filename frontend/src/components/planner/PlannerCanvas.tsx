import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import CourseSearch from "./CourseSearch";
import CourseCard from "./CourseCard";
import { usePlannerStore } from "@/stores/planner-store";

export default function PlannerCanvas() {
    const canvas = usePlannerStore((s) => s.placements.canvas);
    const addCourseToCanvas = usePlannerStore((s) => s.addCourseToCanvas);
    const removeCourse = usePlannerStore((s) => s.removeCourse);

    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
    const itemIds = canvas.map((c) => c.uniqueId);

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-earth md:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Course Search
            </h2>
            <CourseSearch onAddCourse={addCourseToCanvas} />

            <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Canvas
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {canvas.length} course{canvas.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                    <div
                        ref={setNodeRef}
                        className={`min-h-[52px] flex flex-wrap gap-2 rounded-xl border-2 border-dashed p-2 transition-colors ${
                            isOver
                                ? "border-primary bg-primary/5"
                                : "border-border bg-[var(--sand)]/25"
                        }`}
                    >
                        {canvas.map((course) => (
                            <CourseCard
                                key={course.uniqueId}
                                course={course}
                                onRemove={removeCourse}
                                compact
                            />
                        ))}
                        {canvas.length === 0 && !isOver && (
                            <p className="w-full py-2 text-center text-xs text-muted-foreground">
                                Search and add courses above, then drag them to semesters below
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
