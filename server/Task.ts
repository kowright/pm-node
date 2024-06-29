import TaskStatus, { taskStatusMap } from './TaskStatus';
import Roadmap, { roadmapMap } from './Roadmap';
import Assignee, { assigneeMap } from './Assignee';
import { UnitType } from './UnitTypes';

export class Task {
    name: string;
    description: string;
    duration: number;
    roadmaps: Roadmap[];
    assignee: Assignee;
    startDate: Date;
    endDate: Date;
    taskStatus: TaskStatus;
    id: number;
    type: UnitType;

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

let firstTask = new Task(
    'Create Feature Specification',
    'Outline what the feature needs to do',
    [roadmapMap['Engineering']],
    assigneeMap['John Doe'],
    new Date('2024-06-15'),
    new Date('2024-06-30'),
    taskStatusMap['Backlog'],
    1
);

let secondTask = new Task(
    'Create Design Doc',
    'Outline what the feature design is',
    [roadmapMap['Design']],
    assigneeMap['Jane Donuts'],
    new Date('2024-06-30'),
    new Date('2024-07-30'),
    taskStatusMap['In Review'],
    2
);

let thirdTask = new Task(
    'Conduct Design Review',
    'Review All Documentation',
    [roadmapMap['Engineering']],
    assigneeMap['Johnny Cakes'],
    new Date('2024-08-01'),
    new Date('2024-08-02'),
    taskStatusMap['In Progress'],
    3
);

let fourthTask = new Task(
    'Create Tasks',
    'Create Tasks In JIRA',
    [roadmapMap['Engineering']],
    assigneeMap['Kendrick Drake'],
    new Date('2024-08-03'),
    new Date('2024-08-04'),
    taskStatusMap['Backlog'],
    4
);

let fifthTask = new Task(
    'Assign Tasks',
    'Assign People to Tasks',
    [roadmapMap['Engineering'], roadmapMap['Design']],
    assigneeMap['Allisa Joan'],
    new Date('2024-08-05'),
    new Date('2024-08-07'),
    taskStatusMap['In Progress'],
    5
);

export const tasks: Task[] = [
    firstTask,
    secondTask,
    thirdTask,
    fourthTask,
    fifthTask
];


export function createTask(name: string, description: string, roadmaps: Roadmap[], assignee: Assignee,
    startDate: Date, endDate: Date, taskStatus:TaskStatus = taskStatusMap['Backlog']): Task | null {

    const allTaskNames = tasks.map(task => task.name);

    if (allTaskNames.includes(name)) {
        console.error("Task name is already taken.")
        return null;
    }

    if (startDate.getTime() > endDate.getTime()) {
        console.error("Task start date cannot start after the end date.")
        return null
    }

    const newID = tasks.length;

    const newTag = new Task(name, description, roadmaps, assignee, startDate, endDate, taskStatus, newID);

    tasks.push(newTag);
    //tagsMap[name] = newTag;

    return newTag;
}

export function deleteTask(id: number): boolean {

    let index = -1;
    index = tasks.findIndex(task => task.id === id);

    if (index === -1) {
        console.error("Task could not be found by id.")
        return false;
    }

    if (index !== -1) {
        tasks.splice(index, 1);
    }

    return true;
}
