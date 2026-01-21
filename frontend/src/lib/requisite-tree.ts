import type { RequirementCondition } from '@/types/course'

export interface TreeNode {
    id: string
    type: 'operator' | 'course' | 'wildcard'
    label: string
    children?: TreeNode[]
    courseCode?: string
    isWildcard?: boolean
}

export function parseWildcardPattern(pattern: string, description?: string): string {
    if (description) {
        return description
    }

    // Pattern format: "DEPT X[0-9]{2}" where X is the level digit
    // Examples: "CMPUT 3[0-9]{2}", "INT D 3[0-9]{2}", "MATH 2[0-9]{2}"

    // Match department (can have space like "INT D") and level pattern
    const match = pattern.match(/^(.+?)\s+(\d)\[0-9\]\{2\}$/i)

    if (match) {
        const department = match[1].trim()
        const levelDigit = match[2]
        const level = `${levelDigit}00`
        return `Any ${level}-level ${department} course`
    }

    return pattern
}

export function transformToTree(reqCondition: RequirementCondition, parentId = '', counter = { value: 0 }): TreeNode[] {
    if (!reqCondition) return []

    const nodeId = `${parentId}-${++counter.value}`

    if (reqCondition.operator === 'WILDCARD') {
        const label = parseWildcardPattern(
            reqCondition.pattern || '',
            reqCondition.description
        )
        return [{
            id: `${nodeId}-wildcard`,
            type: 'wildcard' as const,
            label,
            isWildcard: true
        }]
    }

    if (reqCondition.operator === 'STANDALONE' && reqCondition.courses) {
        return reqCondition.courses.map((course, index) => ({
            id: `${nodeId}-course-${index}`,
            type: 'course' as const,
            label: course,
            courseCode: course
        }))
    }

    if (reqCondition.operator === 'STANDALONE' && reqCondition.description) {
        return [{
            id: `${nodeId}-desc`,
            type: 'wildcard' as const,
            label: reqCondition.description,
            isWildcard: true
        }]
    }

    if (reqCondition.conditions || reqCondition.courses) {
        const children: TreeNode[] = []

        if (reqCondition.courses) {
            children.push(...reqCondition.courses.map((course, index) => ({
                id: `${nodeId}-course-${index}`,
                type: 'course' as const,
                label: course,
                courseCode: course
            })))
        }

        if (reqCondition.conditions) {
            reqCondition.conditions.forEach((childCondition, index) => {
                children.push(...transformToTree(childCondition, `${nodeId}-${index}`, counter))
            })
        }

        if (children.length > 1) {
            return [{
                id: nodeId,
                type: 'operator' as const,
                label: reqCondition.operator || 'AND',
                children
            }]
        }

        return children
    }

    return []
}