import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FinalCourseDetails, PlanDetail } from "@/types/course";

// ---------- Types ----------

export interface PlannerCourse {
    uniqueId: string;
    code: string;
    title: string;
    credits?: number;
}

export type Placements = Record<string, PlannerCourse[]>;

// ---------- Constants ----------

const SEMESTERS = ["Fall", "Winter"];
const DEFAULT_YEARS = [1, 2, 3, 4];
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ---------- Helpers ----------

export function buildInitialPlacements(years: number[]): Placements {
    const init: Placements = { canvas: [] };
    years.forEach((y) => {
        SEMESTERS.forEach((s) => {
            init[`year${y}-${s}`] = [];
        });
    });
    return init;
}

async function fetchCourseDetails(
    courseCode: string,
): Promise<FinalCourseDetails | null> {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/courses/${encodeURIComponent(courseCode)}`,
            { credentials: "include" },
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data[0] ?? null;
    } catch {
        return null;
    }
}

async function hydratePlacements(placements: Placements): Promise<Placements> {
    const allCodes = new Set<string>();
    for (const items of Object.values(placements)) {
        for (const c of items) allCodes.add(c.code);
    }
    if (allCodes.size === 0) return placements;

    const details = await Promise.all(
        Array.from(allCodes).map(async (code) => {
            const d = await fetchCourseDetails(code);
            return [code, d] as const;
        }),
    );
    const detailMap = new Map(
        details.filter(([, d]) => d !== null) as [string, FinalCourseDetails][],
    );

    const hydrated: Placements = {};
    for (const [key, items] of Object.entries(placements)) {
        hydrated[key] = items.map((c) => {
            const d = detailMap.get(c.code);
            return d
                ? { ...c, title: d.title, credits: d.units?.credits }
                : c;
        });
    }
    return hydrated;
}

interface PlannerState {
    years: number[];
    placements: Placements;
    activePlanId: string | null;
    planName: string;
    isHydrating: boolean;

    // Actions
    addCourseToCanvas: (course: PlannerCourse) => void;
    removeCourse: (uniqueId: string) => void;
    moveCourse: (
        activeId: string,
        overId: string,
        activeContainer: string,
        overContainer: string,
        activeIndex: number,
        overIndex: number,
    ) => void;
    addYear: () => void;
    removeYear: (yearNum: number) => void;
    setPlanName: (name: string) => void;
    setActivePlanId: (id: string | null) => void;
    loadFromApi: (plan: PlanDetail) => Promise<void>;
    reset: () => void;
    toApiCourses: () => { courseCode: string; year: number; term: string }[];

    // Computed
    totalCredits: () => number;
}

// ---------- Store ----------

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            years: DEFAULT_YEARS,
            placements: buildInitialPlacements(DEFAULT_YEARS),
            activePlanId: null,
            planName: "Untitled Plan",
            isHydrating: false,

            addCourseToCanvas: (course) =>
                set((s) => ({
                    placements: {
                        ...s.placements,
                        canvas: [...s.placements.canvas, course],
                    },
                })),

            removeCourse: (uniqueId) =>
                set((s) => {
                    const next: Placements = {};
                    for (const key in s.placements) {
                        next[key] = s.placements[key].filter(
                            (c) => c.uniqueId !== uniqueId,
                        );
                    }
                    return { placements: next };
                }),

            moveCourse: (
                _activeId,
                _overId,
                activeContainer,
                overContainer,
                activeIndex,
                overIndex,
            ) =>
                set((s) => {
                    const next = { ...s.placements };
                    const sourceList = [...(next[activeContainer] || [])];
                    const destList =
                        activeContainer === overContainer
                            ? sourceList
                            : [...(next[overContainer] || [])];

                    const [moved] = sourceList.splice(activeIndex, 1);
                    destList.splice(overIndex, 0, moved);

                    next[activeContainer] = sourceList;
                    if (activeContainer !== overContainer) {
                        next[overContainer] = destList;
                    }
                    return { placements: next };
                }),

            addYear: () => {
                const { years } = get();
                const nextYear =
                    years.length > 0 ? Math.max(...years) + 1 : 1;
                set((s) => {
                    const next = { ...s.placements };
                    SEMESTERS.forEach((sem) => {
                        next[`year${nextYear}-${sem}`] = [];
                    });
                    return {
                        years: [...s.years, nextYear],
                        placements: next,
                    };
                });
            },

            removeYear: (yearNum) =>
                set((s) => {
                    const semKeys = SEMESTERS.map(
                        (sem) => `year${yearNum}-${sem}`,
                    );
                    const coursesInYear = semKeys.flatMap(
                        (k) => s.placements[k] || [],
                    );
                    const next = { ...s.placements };
                    semKeys.forEach((k) => delete next[k]);
                    next.canvas = [...next.canvas, ...coursesInYear];
                    return {
                        years: s.years.filter((y) => y !== yearNum),
                        placements: next,
                    };
                }),

            setPlanName: (name) => set({ planName: name }),
            setActivePlanId: (id) => set({ activePlanId: id }),

            loadFromApi: async (plan) => {
                // Determine years from slot keys
                const slotYears = new Set<number>(DEFAULT_YEARS);
                plan.courses.forEach((c) => {
                    const match = c.term.match(/^year(\d+)-/);
                    if (match) slotYears.add(parseInt(match[1]));
                });
                const yrs = Array.from(slotYears).sort((a, b) => a - b);

                // Build placements from API data
                const placements = buildInitialPlacements(yrs);
                for (const c of plan.courses) {
                    const slot = c.term;
                    if (!placements[slot]) placements[slot] = [];
                    placements[slot].push({
                        uniqueId: `${c.courseCode}-${Date.now()}-${Math.random()}`,
                        code: c.courseCode,
                        title: "",
                        credits: undefined,
                    });
                }

                set({
                    years: yrs,
                    placements,
                    activePlanId: plan.id,
                    planName: plan.name,
                    isHydrating: true,
                });

                // Hydrate course details in background
                const hydrated = await hydratePlacements(placements);
                set({ placements: hydrated, isHydrating: false });
            },

            reset: () => {
                set({
                    years: DEFAULT_YEARS,
                    placements: buildInitialPlacements(DEFAULT_YEARS),
                    activePlanId: null,
                    planName: "Untitled Plan",
                    isHydrating: false,
                });
            },

            toApiCourses: () => {
                const { placements } = get();
                const seen = new Map<
                    string,
                    { courseCode: string; year: number; term: string }
                >();
                for (const [key, items] of Object.entries(placements)) {
                    for (const course of items) {
                        seen.set(course.code, {
                            courseCode: course.code,
                            year: 0,
                            term: key,
                        });
                    }
                }
                return Array.from(seen.values());
            },

            totalCredits: () => {
                const { placements } = get();
                return Object.values(placements)
                    .flat()
                    .reduce((sum, c) => sum + (c.credits || 0), 0);
            },
        }),
        {
            name: "planner-state",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                years: state.years,
                placements: state.placements,
                activePlanId: state.activePlanId,
                planName: state.planName,
            }),
        },
    ),
);
