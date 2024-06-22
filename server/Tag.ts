export interface TagInterface {
    name: string;
    description: string;
}

export type TagType = 'research' | "testing";

export class Tag implements TagInterface {
    name: string;
    description: string;

    constructor(
        name: string,
        description: string,
    ) {
        this.name = name;
        this.description = description;
    }

    getTagName(): string {
        return this.name;
    }
}

export const tags: Tag[] = [
    new Tag(
        "research",
        "use for any tasks that are research and development, searching documentation",
    ),
    new Tag(
        "testing",
        "use for any tasks that are not real",
    ),
];

export const tagsMap: Record<TagType, Tag> = {
    "research": new Tag(
        "research",
        "use for any tasks that are research and development, searching documentation",
    ),
    "testing": new Tag(
        "testing",
        "use for any tasks that are not real",
    ),
};

export default Tag;
