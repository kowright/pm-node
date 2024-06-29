import Roadmap from './Roadmap';
import { roadmapMap } from './Roadmap';
import TaskStatus, { taskStatusMap, TaskStatusType } from './TaskStatus';
import { UnitType, BaseType } from './UnitTypes';

export interface MilestoneInterface extends BaseType {
    date: Date;
    taskStatus: TaskStatus;
}
export class Milestone implements MilestoneInterface {
    name: string;
    description: string;
    date: Date;
    taskStatus: TaskStatus;
    id: number;
    type: UnitType;

    constructor(
        name: string,
        description: string,
        date: Date,
        taskStatus: TaskStatus,
        id: number,
        type: UnitType = "Milestone",
    ) {
        this.name = name;
        this.description = description;
        this.date = date;
        this.taskStatus = taskStatus;
        this.id = id;
        this.type = type;
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

export function createMilestone(name: string, description: string, date: Date, taskStatus: TaskStatus = taskStatusMap['Backlog']): Milestone | null {

    const allMilestoneNames = milestones.map(Milestone => Milestone.name);

    if (allMilestoneNames.includes(name)) {
        console.error("Milestone name is already taken.")
        return null;
    }

    const newID = milestones.length;

    const newTag = new Milestone(name, description, date, taskStatus, newID);

    milestones.push(newTag);
    //tagsMap[name] = newTag;

    return newTag;
}

export function deleteMilestone(id: number): boolean {

    let index = -1;
    index = milestones.findIndex(Milestone => Milestone.id === id);

    if (index === -1) {
        console.error("Milestone could not be found by id.")
        return false;
    }

    if (index !== -1) {
        milestones.splice(index, 1);
    }

    return true;
}


export default Milestone;
