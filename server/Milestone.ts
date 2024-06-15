class Milestone {
    private name: string;
    private description: string;
    private deadline: Date;


    constructor(
        name: string,
        description: string,
        deadline: Date,
    ) {
        this.name = name;
        this.description = description;
        this.deadline = deadline;
    }

    getMilestoneName(): string {
        return this.name;
    }
}

export default Milestone;

/