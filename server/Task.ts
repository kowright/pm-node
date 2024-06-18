export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';

export class Task {
    public name: string;
    private description: string;
    public duration: number;
    private roadmap: string;
    private assignee: string;
    public startDate: Date;
    private endDate: Date;
    public taskStatus: TaskStatus;
    public id: number;

    constructor(
        name: string,
        description: string,
        roadmap: string,
        assignee: string,
        startDate: Date,
        endDate: Date,
        taskStatus: TaskStatus = 'Backlog',
        id: number,
    ) {
        this.name = name;
        this.description = description;
        this.roadmap = roadmap;
        this.assignee = assignee;
        this.startDate = startDate;
        this.endDate = endDate;
        this.duration = this.calculateDuration();
        this.taskStatus = taskStatus;
        this.id = id;
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
