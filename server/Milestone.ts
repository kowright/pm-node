import Roadmap from './Roadmap';
import { roadmapMap } from './Roadmap';
import TaskStatus, { taskStatusMap } from './TaskStatus';
export interface MilestoneInterface {
    name: string;
    description: string;
    date: Date;
    taskStatus: TaskStatus;
    id: number;
}
export class Milestone implements MilestoneInterface {
    name: string;
    description: string;
    date: Date;
    taskStatus: TaskStatus;
    id: number;

    constructor(
        name: string,
        description: string,
        date: Date,
        taskStatus: TaskStatus,
        id: number,
    ) {
        this.name = name;
        this.description = description;
        this.date = date;
        this.taskStatus = taskStatus;
        this.id = id;
    }

    getMilestoneName(): string {
        return this.name;
    }
}

export const milestones: Milestone[] = [
    new Milestone(
        "Project Done",
        "Time to ship!",
        new Date("2024-09-01"),
        taskStatusMap['In Progress'],
        1
    ),
    new Milestone(
        "Protoype Done",
        "Time to test!",
        new Date("2024-08-15"),
        taskStatusMap['In Review'],
        2
    ),
];

export const milestoneMap: Record<string, Milestone> = {
    "Project Done": new Milestone(
        "Project Done",
        "Time to ship!",
        new Date("2024-09-01"),
        taskStatusMap['In Progress'],
        1
    ),
    "Protoype Done": new Milestone(
        "Protoype Done",
        "Time to test!",
        new Date("2024-08-15"),
        taskStatusMap['In Review'],
        2 
    ),
};

export default Milestone;
