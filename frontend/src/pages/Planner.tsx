import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
        <div className="flex min-h-screen flex-col bg-background">
            <Header />

            {showPlanLoader && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Loading your plan...</p>
                    </div>
                </div>
            )}

            <main className="container flex-1 py-8">
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
            </main>

            <Footer />
        </div>
    );
}
