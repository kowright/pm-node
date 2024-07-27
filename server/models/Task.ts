import TaskStatus, { taskStatusMap } from './TaskStatus';
import Roadmap, { roadmapMap } from './Roadmap';
import Assignee from './Assignee';
import { UnitType } from './UnitTypes';
import { Tag } from './Tag';

export class Task {
    name: string;
    description: string;
    duration: number;
    roadmaps: Roadmap[];
    tags: Tag[];
    assignee: Assignee;
    startDate: Date;
    endDate: Date;
    taskStatus: TaskStatus;
    id: number;
    type: number;

    constructor(
        name: string,
        description: string,
        roadmaps: Roadmap[],
        tags: Tag[],
        assignee: Assignee,
        startDate: Date,
        endDate: Date,
        taskStatus: TaskStatus = taskStatusMap['Backlog'],
        id: number,
        type: number,
    ) {
        this.name = name;
        this.description = description;
        this.roadmaps = roadmaps;
        this.tags = tags;
        this.assignee = assignee;
        this.startDate = startDate;
        this.endDate = endDate;
        this.duration = this.calculateDuration();
        this.taskStatus = taskStatus;
        this.id = id;
        this.type = type;
    }

    getTaskName(): string {
        return this.name;
    }

    calculateDuration(startDate = this.startDate, endDate = this.endDate): number {
    // Convert both dates to UTC to ensure no daylight saving time issues
    const utcStartDate = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const utcEndDate = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Calculate the difference in milliseconds
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.abs(utcEndDate - utcStartDate);

    // Convert back to days and return
    return Math.floor(diff / millisecondsPerDay);
}
}
