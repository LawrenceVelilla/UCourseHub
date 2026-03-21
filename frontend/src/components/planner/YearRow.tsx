import { Trash2 } from "lucide-react";
import SemesterColumn from "./SemesterColumn";
import type { PlannerCourse } from "@/stores/planner-store";

interface YearRowProps {
    yearNum: number;
    semesters: Record<string, PlannerCourse[]>;
    onRemove: (uniqueId: string) => void;
    onRemoveYear: () => void;
    canRemove: boolean;
}

export default function YearRow({ yearNum, semesters, onRemove, onRemoveYear, canRemove }: YearRowProps) {
    const totalCredits = Object.values(semesters).flat().reduce((sum, c) => sum + (c.credits || 0), 0);

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-earth">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-2xl font-bold text-foreground">Year {yearNum}</h2>
                    <span className="text-xs font-medium text-muted-foreground">{totalCredits} credits</span>
                </div>
                {canRemove && (
                    <button
                        onClick={onRemoveYear}
                        className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                        title="Remove year"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mb-4 h-px bg-border" />

            <div className="flex flex-col gap-4 sm:flex-row">
                {Object.entries(semesters).map(([semKey, courses]) => (
                    <SemesterColumn
                        key={semKey}
                        droppableId={semKey}
                        title={semKey.split("-")[1]}
                        courses={courses}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div>
    );
}
