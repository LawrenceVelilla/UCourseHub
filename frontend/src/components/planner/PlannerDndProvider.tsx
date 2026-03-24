import { useState, useCallback, type ReactNode } from "react";
import {
    DndContext,
    closestCorners,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import CourseCard from "./CourseCard";
import { usePlannerStore, type PlannerCourse } from "@/stores/planner-store";

export default function PlannerDndProvider({ children }: { children: ReactNode }) {
    const placements = usePlannerStore((s) => s.placements);
    const moveCourse = usePlannerStore((s) => s.moveCourse);
    const [activeDrag, setActiveDrag] = useState<PlannerCourse | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    const findContainer = useCallback(
        (id: string): string | null => {
            if (placements[id] !== undefined) return id;
            for (const [key, items] of Object.entries(placements)) {
                if (items.some((c) => c.uniqueId === id)) return key;
            }
            return null;
        },
        [placements],
    );

    const handleDragStart = (event: DragStartEvent) => {
        const container = findContainer(event.active.id as string);
        if (!container) return;
        const course = placements[container]?.find(
            (c) => c.uniqueId === event.active.id,
        );
        if (course) setActiveDrag(course);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDrag(null);
        const { active, over } = event;
        if (!over) return;

        const activeContainer = findContainer(active.id as string);
        let overContainer = findContainer(over.id as string);

        if (!activeContainer) return;
        if (!overContainer && placements[over.id as string] !== undefined) {
            overContainer = over.id as string;
        }
        if (!overContainer) return;

        const activeIndex = placements[activeContainer].findIndex(
            (c) => c.uniqueId === active.id,
        );
        const overIndex = placements[overContainer].findIndex(
            (c) => c.uniqueId === over.id,
        );
        const finalOverIndex = overIndex === -1
            ? placements[overContainer].length
            : overIndex;

        if (activeContainer === overContainer && activeIndex === finalOverIndex) return;

        moveCourse(
            active.id as string,
            over.id as string,
            activeContainer,
            overContainer,
            activeIndex,
            finalOverIndex,
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {children}
            <DragOverlay>
                {activeDrag ? (
                    <div className="pointer-events-none">
                        <CourseCard course={activeDrag} onRemove={() => {}} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
