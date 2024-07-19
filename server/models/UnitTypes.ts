

export type UnitType = 'Task' | 'Milestone' | "Tag" | 'Assignee' | 'Task Status' | 'Roadmap';

export interface BaseType {
    name: string;
    description: string;
    type: number;
    id: number;
}