import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePlan, useUpdatePlan } from "@/hooks/usePlans";
import { usePlannerStore } from "@/stores/planner-store";

export default function PlannerToolbar() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const planName = usePlannerStore((s) => s.planName);
    const activePlanId = usePlannerStore((s) => s.activePlanId);
    const setPlanName = usePlannerStore((s) => s.setPlanName);
    const setActivePlanId = usePlannerStore((s) => s.setActivePlanId);
    const addYear = usePlannerStore((s) => s.addYear);
    const toApiCourses = usePlannerStore((s) => s.toApiCourses);
    const totalCredits = usePlannerStore((s) => s.totalCredits);

    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        setIsSaving(true);
        try {
            const courses = toApiCourses();
            if (activePlanId) {
                await updatePlan.mutateAsync({ id: activePlanId, name: planName, courses });
            } else {
                const plan = await createPlan.mutateAsync(planName);
                setActivePlanId(plan.id);
                await updatePlan.mutateAsync({ id: plan.id, courses });
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
            console.error("Failed to save plan:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="max-w-xs border-none bg-transparent font-serif text-2xl font-bold text-foreground shadow-none focus-visible:ring-0 p-0 h-auto"
                    placeholder="Plan name..."
                />
                <span className="text-sm text-muted-foreground">{totalCredits()} credits</span>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={isSaving || saveSuccess}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saveSuccess ? (
                        <Check className="mr-2 h-4 w-4" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : saveSuccess ? "Saved!" : activePlanId ? "Save" : "Save Plan"}
                </Button>
                <Button onClick={addYear} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Year
                </Button>
            </div>
        </div>
    );
}
