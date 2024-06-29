import { UnitType, BaseType } from './UnitTypes';

export interface TagInterface extends BaseType{
    name: string;
    description: string;
}

export type TagType = 'research' | "testing";

export class Tag implements TagInterface {
    name: string;
    description: string;
    id: number;
    type: UnitType;

    constructor(
        name: string,
        description: string,
        id: number,
        type: UnitType = "Tag",
    ) {
        this.name = name;
        this.description = description;
        this.id = id;
        this.type = type;
    }

    getTagName(): string {
        return this.name;
    }
}

export const tags: Tag[] = [
    new Tag(
        "research",
        "use for any tasks that are research and development, searching documentation",
        0
    ),
    new Tag(
        "testing",
        "use for any tasks that are not real",
        1
    ),
];

export const tagsMap: Record<TagType, Tag> = {
    "research": new Tag(
        "research",
        "use for any tasks that are research and development, searching documentation",
        0
    ),
    "testing": new Tag(
        "testing",
        "use for any tasks that are not real",
        1
    ),
};

export function createTag(name: string, description: string): Tag | null {
    
    const allTagNames = tags.map(tag => tag.name);

    if (allTagNames.includes(name)) {
        console.error("Tag name is already taken.")
        return null;
    }

    const newID = tags.length; 
 
    const newTag = new Tag(name, description, newID);

    tags.push(newTag);
    //tagsMap[name] = newTag;

    return newTag;
}

export function deleteTag(id: number): boolean {

    let index = -1;
    index = tags.findIndex(tag => tag.id === id);

    if (index === -1) {
        console.error("Tag could not be found by id.")
        return false;
    }

    if (index !== -1) {
        tags.splice(index, 1);
    }

    return true;
}



export default Tag;
