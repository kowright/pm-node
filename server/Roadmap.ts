import { milestoneMap } from './Milestone';
import Milestone, { milestones } from './Milestone';
import Tag, { tagsMap } from './Tag';

export type RoadmapList = 'Engineering' | "Design";

type RoadmapType = {
    name: string;
    description: string;
    milestones: Milestone[];
    tags: Tag[]; 
    id: number;
}

export class Roadmap implements RoadmapType {
    name: string;
    description: string;
    milestones: Milestone[];
    tags: Tag[];
    id: number;

    constructor(name: string, description: string, milestones: Milestone[], tags: Tag[], id: number) {
        this.name = name;
        this.description = description;
        this.milestones = milestones;
        this.tags = tags;
        this.id = id;
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

