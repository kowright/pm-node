class Task {
    private name: string;
    private description: string;
    private duration: number;
    private roadmap: string;
    private assignee: string;
    private startDate: Date;
    private endDate: Date;

    constructor(
        name: string,
        description: string,
        duration: number,
        roadmap: string,
        assignee: string,
        startDate: Date,
        endDate: Date
    ) {
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.roadmap = roadmap;
        this.assignee = assignee;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    getTaskName(): string {
        return this.name;
    }
}

export default Task;
