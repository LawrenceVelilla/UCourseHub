import PageLayout from "@/components/layout/PageLayout";
import PlannerToolbar from "@/components/planner/PlannerToolbar";
import PlannerDndProvider from "@/components/planner/PlannerDndProvider";
import PlannerCanvas from "@/components/planner/PlannerCanvas";
import YearRow from "@/components/planner/YearRow";
import { usePlannerStore } from "@/stores/planner-store";
import { usePlannerSync } from "@/hooks/usePlannerSync";

const SEMESTERS = ["Fall", "Winter"];

export default function Planner() {
    const { showPlanLoader } = usePlannerSync();
    const years = usePlannerStore((s) => s.years);
    const placements = usePlannerStore((s) => s.placements);
    const removeCourse = usePlannerStore((s) => s.removeCourse);
    const removeYear = usePlannerStore((s) => s.removeYear);

    return (
        <PageLayout isLoading={showPlanLoader} loadingMessage="Loading your plan...">
            <PlannerToolbar />

            <PlannerDndProvider>
                <div className="space-y-6">
                    <PlannerCanvas />

                    {Array.from(
                        { length: Math.ceil(years.length / 2) },
                        (_, i) => years.slice(i * 2, i * 2 + 2),
                    ).map((pair, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {pair.map((yearNum) => {
                                const semesters: Record<string, typeof placements[string]> = {};
                                SEMESTERS.forEach((s) => {
                                    const key = `year${yearNum}-${s}`;
                                    semesters[key] = placements[key] || [];
                                });
                                return (
                                    <YearRow
                                        key={yearNum}
                                        yearNum={yearNum}
                                        semesters={semesters}
                                        onRemove={removeCourse}
                                        onRemoveYear={() => removeYear(yearNum)}
                                        canRemove={years.length > 1}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </PlannerDndProvider>
        </PageLayout>
    );
}
