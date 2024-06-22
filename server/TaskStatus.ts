export interface TaskStatusInterface {
    name: string;
    description: string;
}

export type TasktatusType = 'In Progress' | 'In Review' | 'Backlog' | 'To Do' | 'Approved' | 'Merged' | 'Complete';

export class TaskStatus implements TaskStatusInterface {
    name: string;
    description: string;

    constructor(
        name: string,
        description: string,
    ) {
        this.name = name;
        this.description = description;
    }

    getTaskStatusName(): string {
        return this.name;
    }
}

export const taskStatus: TaskStatus[] = [
    new TaskStatus(
        "In Progress",
        "use for tasks that are currently and actively being worked on"
    ),
    new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed"
    ),
    new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon"
    ),
    new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon"
    ),
    new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged"
    ),
    new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch"
    ),
    new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived"
    ),
];

export const taskStatusMap: Record<TasktatusType, TaskStatus> = {
    "In Progress": new TaskStatus(
        "In Progress",
        "use for tasks that are currently and actively being worked on"
    ),
    "In Review": new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed"
    ),
    "Backlog": new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon"
    ),
    "To Do": new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon"
    ),
    "Approved": new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged"
    ),
    "Merged": new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch"
    ),
    Complete: new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived"
    ),
};


export default TaskStatus;
