import { UnitType, BaseType } from './UnitTypes';

export interface AssigneeInterface extends BaseType {
    imageId: number;
   //role?
}

export type AssigneeType = 'John Doe' | 'Jane Donuts' | "Johnny Cakes" | 'Kendrick Drake' | 'Allisa Joan';

export class Assignee implements AssigneeInterface {
    name: string;
    description: string;
    id: number;
    type: number;
    imageId: number;
    constructor(
        name: string,
        description: string,
        id: number,
        type: number,
        imageId: number,
    ) {
        this.name = name;
        this.description = description;
        this.id = id;
        this.type = type
        this.imageId = imageId;
    }
}



export default Assignee;

//could have duplicates