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
    type: UnitType;

    constructor(
        name: string,
        description: string,
        id: number,
        type: UnitType = "Task Status",
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
        2
    ),
    new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed",
        3
    ),
    new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon",
        0
    ),
    new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon",
        1
    ),
    new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged",
        4
    ),
    new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch",
        5
    ),
    new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived",
        6
    ),
];

export const taskStatusMap: Record<TaskStatusType, TaskStatus> = {
    "In Progress": new TaskStatus(
        "In Progress",
        "use for tasks that are currently and actively being worked on",
        2
    ),
    "In Review": new TaskStatus(
        "In Review",
        "use for any tasks that are currently and actively being reviewed",
        3
    ),
    "Backlog": new TaskStatus(
        "Backlog",
        "use for any tasks that are not actively worked on and are not queued up to be worked on soon",
        0
    ),
    "To Do": new TaskStatus(
        "To Do",
        "use for any tasks that are not actively worked on and are queued up to be worked on soon",
        1
    ),
    "Approved": new TaskStatus(
        "Approved",
        "use for any tasks that passed review but are not merged",
        4
    ),
    "Merged": new TaskStatus(
        "Merged",
        "use for any tasks that are approved and merged into their respective parent branch",
        5
    ),
    Complete: new TaskStatus(
        "Complete",
        "use for any tasks that are merged so that they can be archived",
        6
    ),
};

export function createTaskStatus(name: string, description: string): TaskStatus | null {

    const allTaskStatuses = taskStatusList.map(status => status.name);

    if (allTaskStatuses.includes(name)) {
        console.error("Task Status name is already taken.")
        return null;
    }

    const newID = taskStatusList.length;

    const newTaskStatus = new TaskStatus(name, description, newID);

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
