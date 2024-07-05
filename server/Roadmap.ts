import { milestoneMap } from './Milestone';
import Milestone, { milestones } from './Milestone';
import Tag, { tagsMap } from './Tag';
import { UnitType, BaseType } from './UnitTypes';

export type RoadmapList = 'Engineering' | "Design";

interface RoadmapType extends BaseType {
    //milestones: Milestone[]; Milestones will now have roadmaps- roadmap will be a base type that others have
   // tags: Tag[]; 
}

export class Roadmap implements RoadmapType {
    name: string;
    description: string;
    //milestones: Milestone[];
   // tags: Tag[];
    id: number;
    type: number;

    constructor(
        name: string,
        description: string,
       // milestones: Milestone[],
        //tags: Tag[],
        id: number,
        type: number,
    ) {
        this.name = name;
        this.description = description;
       // this.milestones = milestones;
        //this.tags = tags;
        this.id = id;
        this.type = type;
    }
}

export const roadmaps: Roadmap[] = [
    new Roadmap(
        "Design",
        "All artists, assets, graphics and UX/UI roles plans",
       // [milestoneMap['Project Done']],
        //[],
        1,
        -1
    ),
    new Roadmap(
        "Engineering",
        "All developers and engineering roles plans",
       // [milestoneMap['Protoype Done'], milestoneMap['Project Done'] ],
        //[],
        2,
        -1
    ),
];

export const roadmapMap: Record<string, Roadmap> = {
    "Engineering": new Roadmap(
        "Engineering",
        "All developers and engineering roles plans",
       // [milestoneMap['Protoype Done'], milestoneMap['Project Done']],
       // [],
        2,
        -1
    ),
   "Design": new Roadmap(
        "Design",
        "All artists, assets, graphics and UX/UI roles plans",
       // [milestoneMap['Project Done']],
        //[],
       1,
       -1
    ),
};

export function createRoadmap(name: string, description: string, tags: Tag[]): Roadmap | null {

    const allTagNames = roadmaps.map(Roadmap => Roadmap.name);

    if (allTagNames.includes(name)) {
        console.error("Roadmap name is already taken.")
        return null;
    }

    const newID = roadmaps.length;

    const newTag = new Roadmap(name, description, newID, -1);

    roadmaps.push(newTag);
    //tagsMap[name] = newTag;

    return newTag;
}

export function deleteRoadmap(id: number): boolean {

    let index = -1;
    index = roadmaps.findIndex(Roadmap => Roadmap.id === id);

    if (index === -1) {
        console.error("Roadmap could not be found by id.")
        return false;
    }

    if (index !== -1) {
        roadmaps.splice(index, 1);
    }

    return true;
}


export default Roadmap;

