import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserCourse } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

function apiFetch(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, { credentials: "include", ...init });
}

export function useUserCourses() {
    return useQuery({
        queryKey: ['userCourses'],
        queryFn: async (): Promise<UserCourse[]> => {
            const res = await apiFetch(`${API_BASE_URL}/api/user/courses`);
            if (!res.ok) throw new Error('Failed to fetch courses');
            return res.json();
        },
    });
}

export function useAddUserCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { courseCode: string; term: string; year: number; grade?: string }) => {
            const res = await apiFetch(`${API_BASE_URL}/api/user/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to add course');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCourses'] }),
    });
}

export function useDeleteUserCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (courseCode: string) => {
            const res = await apiFetch(`${API_BASE_URL}/api/user/courses/${encodeURIComponent(courseCode)}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete course');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCourses'] }),
    });
}
