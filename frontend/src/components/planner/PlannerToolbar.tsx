import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Save, Loader2, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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

    const [renameOpen, setRenameOpen] = useState(false);
    const [draftName, setDraftName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const openRename = () => {
        setDraftName(planName);
        setRenameOpen(true);
    };

    const confirmRename = () => {
        const trimmed = draftName.trim();
        if (trimmed) setPlanName(trimmed);
        setRenameOpen(false);
    };

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
        <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="font-serif text-2xl font-bold">{planName || "Untitled Plan"}</h1>
                        <button
                            onClick={openRename}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    </div>
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

            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Schedule</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename();
                        }}
                        placeholder="Schedule name..."
                        autoFocus
                        maxLength={100}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRename} disabled={!draftName.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
