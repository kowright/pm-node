export interface AssigneeInterface {
    name: string;
   //role
}

export type AssigneeType = 'John Doe' | 'Jane Donuts' | "Johnny Cakes" | 'Kendrick Drake' | 'Allisa Joan';

export class Assignee implements AssigneeInterface {
    name: string;

    constructor(
        name: string,
    ) {
        this.name = name;
    }

    getAssigneeName(): string {
        return this.name;
    }
}

export const assigneeMap: Record<AssigneeType, Assignee> = {
    "John Doe": new Assignee(
        "John Doe"
    ),
    "Jane Donuts": new Assignee(
        "Jane Donuts"
    ),
    "Johnny Cakes": new Assignee(
        "Johnny Cakes"
    ),
    "Kendrick Drake": new Assignee(
        "Kendrick Drake"
    ),
    "Allisa Joan": new Assignee(
        "Allisa Joan"
    ),
};

export const assignees: Assignee[] = [
    new Assignee(
        "John Doe"
    ),
    new Assignee(
        "Jane Donuts"
    ),
    new Assignee(
        "Johnny Cakes"
    ),
    new Assignee(
        "Kendrick Drake"
    ),
    new Assignee(
        "Allisa Joan"
    ),
]

export default Assignee;

//could have duplicates