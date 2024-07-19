import { UnitType, BaseType } from './UnitTypes';

export interface TaskStatusInterface extends BaseType {
    name: string;
    description: string;
}

export type TaskStatusType = 'In Progress' | 'In Review' | 'Backlog' | 'To Do' | 'Approved' | 'Merged' | 'Complete';

export class TaskStatus implements TaskStatusInterface {
    name: string;
    description: string;
    id: number;
    type: number;

    constructor(
        name: string,
        description: string,
        id: number,
        type: number,
    ) {
        this.name = name;
        this.description = description;
        this.id = id;
        this.type = type;
    }

    getTaskStatusName(): string {
        return this.name;
    }
}

export const taskStatusList: TaskStatus[] = [
    new TaskStatus(
        "In Progress",
        "use for tasks that are currently and actively being worked on",
        2,
        -1
    ),
    new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed",
        3,
        -1
    ),
    new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon",
        0,
        -1
    ),
    new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon",
        1,
        -1
    ),
    new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged",
        4,
        -1
    ),
    new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch",
        5,
        -1
    ),
    new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived",
        6,
        -1
    ),
];

export const taskStatusMap: Record<TaskStatusType, TaskStatus> = {
    "In Progress": new TaskStatus(
        "In Progress",
        "use for tasks that are currently and actively being worked on",
        2,
        -1
    ),
    "In Review": new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed",
        3,
        -1
    ),
    "Backlog": new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon",
        0,
        -1
    ),
    "To Do": new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon",
        1,
        -1
    ),
    "Approved": new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged",
        4,
        -1
    ),
    "Merged": new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch",
        5,
        -1
    ),
    Complete: new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived",
        6,
        -1
    ),
};

export function createTaskStatus(name: string, description: string): TaskStatus | null {

    const allTaskStatuses = taskStatusList.map(status => status.name);

    if (allTaskStatuses.includes(name)) {
        console.error("Task Status name is already taken.")
        return null;
    }

    const newID = taskStatusList.length;

    const newTaskStatus = new TaskStatus(name, description, newID, -1);

    taskStatusList.push(newTaskStatus);
    //tagsMap[name] = newTag;

    return newTaskStatus;
}

export function deleteTaskStatus(id: number): boolean {

    let index = -1;
    index = taskStatusList.findIndex(status => status.id === id);

    if (index === -1) {
        console.error("Task status could not be found by id.")
        return false;
    }

    if (index !== -1) {
        taskStatusList.splice(index, 1);
    }

    return true;
}


export default TaskStatus;
