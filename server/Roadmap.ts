import { milestoneMap } from './Milestone';
import Milestone, { milestones } from './Milestone';
import Tag, { tagsMap } from './Tag';
import { UnitType, BaseType } from './UnitTypes';

export type RoadmapList = 'Engineering' | "Design";

interface RoadmapType extends BaseType {
    milestones: Milestone[];
    tags: Tag[]; 
}

export class Roadmap implements RoadmapType {
    name: string;
    description: string;
    milestones: Milestone[];
    tags: Tag[];
    id: number;
    type: UnitType;

    constructor(
        name: string,
        description: string,
        milestones: Milestone[],
        tags: Tag[],
        id: number,
        type: UnitType = "Roadmap",
    ) {
        this.name = name;
        this.description = description;
        this.milestones = milestones;
        this.tags = tags;
        this.id = id;
        this.type = type;
    }
}

export const roadmaps: Roadmap[] = [
    new Roadmap(
        "Design",
        "All artists, assets, graphics and UX/UI roles plans",
        [milestoneMap['Project Done']],
        [],
        1,
    ),
    new Roadmap(
        "Engineering",
        "All developers and engineering roles plans",
        [milestoneMap['Protoype Done'], milestoneMap['Project Done'] ],
        [],
        2,
    ),
];

export const roadmapMap: Record<string, Roadmap> = {
    "Engineering": new Roadmap(
        "Engineering",
        "All developers and engineering roles plans",
        [milestoneMap['Protoype Done'], milestoneMap['Project Done']],
        [],
        2,
    ),
   "Design": new Roadmap(
        "Design",
        "All artists, assets, graphics and UX/UI roles plans",
        [milestoneMap['Project Done']],
        [],
        1,
    ),
};

export default Roadmap;

