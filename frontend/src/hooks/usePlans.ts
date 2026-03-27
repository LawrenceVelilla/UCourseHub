import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Plan, PlanDetail } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

function apiFetch(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, { credentials: "include", ...init });
}

export function usePlans() {
    return useQuery({
        queryKey: ['plans'],
        queryFn: async (): Promise<Plan[]> => {
            const res = await apiFetch(`${API_BASE_URL}/api/v1/plans`);
            if (!res.ok) throw new Error('Failed to fetch plans');
            return res.json();
        },
    });
}

export function usePlan(planId: string | null) {
    return useQuery({
        queryKey: ['plan', planId],
        queryFn: async (): Promise<PlanDetail> => {
            const res = await apiFetch(`${API_BASE_URL}/api/v1/plans/${planId}`);
            if (!res.ok) throw new Error('Failed to fetch plan');
            return res.json();
        },
        enabled: !!planId,
    });
}

export function useCreatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (name: string) => {
            const res = await apiFetch(`${API_BASE_URL}/api/v1/plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Failed to create plan');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    });
}

export function useUpdatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, courses }: { id: string; name?: string; courses?: { courseCode: string; year: number; term: string }[] }) => {
            const res = await apiFetch(`${API_BASE_URL}/api/v1/plans/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, courses }),
            });
            if (!res.ok) throw new Error('Failed to update plan');
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            queryClient.invalidateQueries({ queryKey: ['plan', variables.id] });
        },
    });
}

export function useDeletePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planId: string) => {
            const res = await apiFetch(`${API_BASE_URL}/api/v1/plans/${planId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete plan');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    });
}
