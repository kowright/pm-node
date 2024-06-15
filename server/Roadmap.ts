import Milestone from './Milestone';

type RoadmapType = {
    name: string;
    description: string;
    milestone: Milestone; //should be multiple milestones
    tag: string; //should be multiple tags
}

class Roadmap implements RoadmapType {
    name: string;
    description: string;
    milestone: Milestone;
    tag: string;

    constructor(name: string, description: string, milestone: Milestone, tag: string) {
        this.name = name;
        this.description = description;
        this.milestone = milestone;
        this.tag = tag;
    }
}

export default Roadmap;

//eng roadmap
//design roadmap