type ViewType = {
    name: string;
    description: string;
}

class View implements ViewType {
    name: string;
    description: string;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;

    }
}

export default View;

//kanban view
//timeline view 