import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlans, useCreatePlan, useDeletePlan } from '@/hooks/usePlans';
import { Calendar, Trash2, Plus, Loader2 } from 'lucide-react';
import type { Plan } from '@/types/course';

export default function PlanList() {
    const navigate = useNavigate();
    const { data: plans, isLoading } = usePlans();
    const createPlan = useCreatePlan();
    const deletePlan = useDeletePlan();
    const [newPlanName, setNewPlanName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlanName.trim()) return;
        await createPlan.mutateAsync(newPlanName.trim());
        setNewPlanName('');
        setIsCreating(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <h2 className="font-serif text-xl font-semibold">Saved Schedules</h2>
                {[1, 2].map(i => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Saved Schedules</h2>
                {!isCreating && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreating(true)}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        New Schedule
                    </Button>
                )}
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="flex gap-2">
                    <Input
                        placeholder="Schedule name..."
                        value={newPlanName}
                        onChange={e => setNewPlanName(e.target.value)}
                        autoFocus
                        maxLength={100}
                    />
                    <Button type="submit" disabled={createPlan.isPending || !newPlanName.trim()}>
                        {createPlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                        Cancel
                    </Button>
                </form>
            )}

            {plans && plans.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {plans.map((plan: Plan) => (
                        <Card
                            key={plan.id}
                            className="group relative cursor-pointer transition-shadow hover:shadow-earth-lg"
                            onClick={() => navigate(`/planner?plan=${plan.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                                        <CardTitle className="truncate text-base">{plan.name}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => { e.stopPropagation(); deletePlan.mutate(plan.id); }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : !isCreating ? (
                <p className="text-sm text-muted-foreground">No saved schedules yet. Create one to get started.</p>
            ) : null}
        </div>
    );
}
