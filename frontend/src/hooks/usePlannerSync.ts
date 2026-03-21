import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlans";
import { usePlannerStore } from "@/stores/planner-store";

export function usePlannerSync() {
    const [searchParams] = useSearchParams();
    const loadPlanId = searchParams.get("plan");
    const { isAuthenticated } = useAuth();

    const activePlanId = usePlannerStore((s) => s.activePlanId);
    const isHydrating = usePlannerStore((s) => s.isHydrating);
    const loadFromApi = usePlannerStore((s) => s.loadFromApi);
    const reset = usePlannerStore((s) => s.reset);

    const { data: loadedPlan, isLoading: isPlanLoading } = usePlan(loadPlanId);
    const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);

    // Load plan from URL param
    useEffect(() => {
        if (!loadPlanId || !loadedPlan) return;
        if (loadedPlanId === loadPlanId) return;
        setLoadedPlanId(loadPlanId);
        loadFromApi(loadedPlan);
    }, [loadPlanId, loadedPlan, loadedPlanId, loadFromApi]);

    // Clear on logout
    useEffect(() => {
        if (!isAuthenticated && activePlanId) {
            reset();
        }
    }, [isAuthenticated, activePlanId, reset]);

    const showPlanLoader = !!loadPlanId && (isPlanLoading || isHydrating);

    return { showPlanLoader };
}
