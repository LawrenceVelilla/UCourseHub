import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { FinalCourseDetails, RedditDiscussion, Professor } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CourseDependent {
    id: string;
    courseCode: string;
    title: string;
    department: string;
    flattenedPrerequisites: string[];
    flattenedCorequisites: string[];
}


export interface DependentsResponse {
    prereqDependents: CourseDependent[];
    coreqDependents: CourseDependent[];
}

interface DiscussionsResponse {
    discussions: RedditDiscussion[];
    hasMore: boolean;
}

async function fetchCourse(courseCode: string): Promise<FinalCourseDetails | null> {
    const response = await fetch(
        `${API_BASE_URL}/api/course?courseCode=${encodeURIComponent(courseCode)}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`);
    }

    const data = await response.json();
    return data[0] ?? null;
}

async function fetchDependents(courseCode: string): Promise<DependentsResponse> {
    const response = await fetch(
        `${API_BASE_URL}/api/dependents?courseCode=${encodeURIComponent(courseCode)}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch dependents: ${response.statusText}`);
    }

    return response.json();
}

export function useCourse(courseCode: string | null) {
    return useQuery({
        queryKey: ['course', courseCode],
        queryFn: () => fetchCourse(courseCode!),
        enabled: !!courseCode,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useDependents(courseCode: string | null) {
    return useQuery({
        queryKey: ['dependents', courseCode],
        queryFn: () => fetchDependents(courseCode!),
        enabled: !!courseCode,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

async function fetchRedditDiscussions(
    courseId: string,
    limit: number = 10,
    offset: number = 0
): Promise<DiscussionsResponse> {
    const response = await fetch(
        `${API_BASE_URL}/api/reddit/discussions?courseId=${encodeURIComponent(courseId)}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch discussions: ${response.statusText}`);
    }

    return response.json();
}

export function useRedditDiscussions(courseId: string | null, limit: number = 10) {
    return useInfiniteQuery({
        queryKey: ['reddit-discussions', courseId, limit],
        queryFn: ({ pageParam = 0 }) => fetchRedditDiscussions(courseId!, limit, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length * limit;
        },
        enabled: !!courseId,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

async function fetchProfessors(courseId: string): Promise<Professor[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/professors?courseId=${encodeURIComponent(courseId)}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch professors: ${response.statusText}`);
    }

    return response.json();
}

export function useProfessors(courseId: string | null) {
    return useQuery({
        queryKey: ['professors', courseId],
        queryFn: () => fetchProfessors(courseId!),
        enabled: !!courseId,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
