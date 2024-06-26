import TaskStatus, { taskStatusMap } from './TaskStatus';
import Roadmap from './Roadmap';
import Assignee from './Assignee';
import { UnitType } from './UnitTypes';

export class Task {
    public name: string;
    public description: string;
    public duration: number;
    private roadmaps: Roadmap[];
    public assignee: Assignee;
    public startDate: Date;
    public endDate: Date;
    public taskStatus: TaskStatus;
    public id: number;
    public type: UnitType;

    constructor(
        name: string,
        description: string,
        roadmaps: Roadmap[],
        assignee: Assignee,
        startDate: Date,
        endDate: Date,
        taskStatus: TaskStatus = taskStatusMap['Backlog'],
        id: number,
        type: UnitType = "Task",
    ) {
        this.name = name;
        this.description = description;
        this.roadmaps = roadmaps;
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
