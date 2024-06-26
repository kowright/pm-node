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

export default Tag;
