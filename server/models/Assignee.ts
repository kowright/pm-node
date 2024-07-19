import { UnitType, BaseType } from './UnitTypes';

export interface AssigneeInterface extends BaseType {

   //role
}

export type AssigneeType = 'John Doe' | 'Jane Donuts' | "Johnny Cakes" | 'Kendrick Drake' | 'Allisa Joan';

export class Assignee implements AssigneeInterface {
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

    getAssigneeName(): string {
        return this.name;
    }
}

export const assigneeMap: Record<AssigneeType, Assignee> = {
    "John Doe": new Assignee(
        "John Doe",
        "",
        0,
        -1
    ),
    "Jane Donuts": new Assignee(
        "Jane Donuts",
        "",
        1,
        -1
    ),
    "Johnny Cakes": new Assignee(
        "Johnny Cakes",
        "",
        2,
        -1
    ),
    "Kendrick Drake": new Assignee(
        "Kendrick Drake",
        "Ya'll messy",
        3,
        -1
    ),
    "Allisa Joan": new Assignee(
        "Allisa Joan",
        "",
        4,
        -1
    ),
};

export const assignees: Assignee[] = [
    new Assignee(
        "John Doe",
        "",
        0,
        -1
    ),
    new Assignee(
        "Jane Donuts",
        "",
        1,
        -1
    ),
    new Assignee(
        "Johnny Cakes",
        "",
        2,
        -1
    ),
    new Assignee(
        "Kendrick Drake",
        "Ya'll messy",
        3,
        -1
    ),
    new Assignee(
        "Allisa Joan",
        "",
        4,
        -1
    ),
]

export function createAssignee(name: string, description: string): Assignee | null {

    const allAssigneeNames = assignees.map(tag => tag.name);

    if (allAssigneeNames.includes(name)) {
        console.error("Assignee name is already taken.")
        return null;
    }

    const newID = assignees.length;

    const newTag = new Assignee(name, description, newID, -1);

    assignees.push(newTag);
    //tagsMap[name] = newTag;

    return newTag;
}

export function deleteAssignee(id: number): boolean {

    let index = -1;
    index = assignees.findIndex(a => a.id === id);

    if (index === -1) {
        console.error("Assignee could not be found by id.")
        return false;
    }

    if (index !== -1) {
        assignees.splice(index, 1);
    }

    return true;
}




export default Assignee;

//could have duplicates