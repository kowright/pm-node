import dotenv from "dotenv";
import path from "path";
import { myDateTime } from './test'
import { Task, tasks, createTask, deleteTask} from './Task';
import express, { Request, Response, Express, NextFunction, query } from 'express';
import Roadmap, { roadmapMap, roadmaps, createRoadmap, deleteRoadmap } from "./Roadmap";
import { taskStatusMap, taskStatusList, createTaskStatus, deleteTaskStatus } from './TaskStatus';
import Assignee, { assigneeMap, assignees, createAssignee, deleteAssignee } from './Assignee';
import Milestone, { milestones, createMilestone, deleteMilestone } from "./Milestone";
import { tags, createTag, deleteTag, Tag} from './Tag';
const validator = require('validator'); 
const dayjs = require('dayjs');


const { Pool } = require('pg');

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); //parses incoming requests as JSON for POST PUT PATCH from request body
app.use(express.urlencoded({ extended: true }));//parses incoming requests as key-value pairs for GET requests from request.query 


//for distinguishing logs from backend on the frontend
const formatMessageToClient = (text: string) => {
    return "[SERVER] " + text;
}

// #region Postgres
const postgresPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'projectmanagement',
    password: process.env.POSTGRES_PASSWORD,
    port: 5432, // default PostgreSQL port
});

async function queryPostgres(query: string, params?: any[]) {
    let client: any;

    try {
        client = await postgresPool.connect();

        let result;
        if (params && params.length > 0) {
            result = await client.query(query, params);
        } else {
            result = await client.query(query);
        }

        return result.rows;
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
}

const formatSelectIdfromDatabaseQuery = (databaseName: string, id: number) => {
    return `SELECT * FROM ${databaseName} WHERE id = ${id}`;
};

const formatDeleteIdfromDatabaseQuery = (databaseName: string, id: number) => {
    return `DELETE FROM ${databaseName} WHERE id = ${id}`;
};

const formatSelectAllFromTable = (tableName: string) => {
    return `SELECT * FROM ${tableName}`; 
};

// #endregion

app.get("/", (req: Request, res: Response) => {
	res.send("Kortney's Express + TypeScript Server");
});

// #region Validators
const isNumValidator = (id: number) => {
    if (isNaN(id) || id <= 0) {
        return false;
    }
    return true;
};

const isBooleanStringValidator = (i: any) => {
    return i === 'true' || i === 'false'
}

// #endregion


//#region Tasks
app.get("/api/tasks", (req: Request, res: Response) => {
    res.send({ message: tasks }); //remove message and fix frontend from this
});

app.put("/api/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id); 
    const { startDate, name, description, endDate, assignee, taskStatus, type, roadmaps } = req.body; //Add back taskStatus, name
    //const { name } = req.body; //Add back taskStatus
    // Find the task by ID
    if (type != 'Task') {
        return res.status(404).json({ error: 'This is not a task- check the API endpoint'}); 
    }

    const taskToUpdate = tasks.find(task => task.id === taskId);
    console.log("updating task " + name)
    if (!taskToUpdate) {
        return res.status(404).json({ error: 'Task not found' }); 
    }
    //console.log("roadmaps ", roadmaps)
    // Update task properties

    console.log("start date " + startDate);

    taskToUpdate.name = name;
    taskToUpdate.startDate = startDate;
    taskToUpdate.description = description;
    taskToUpdate.endDate = endDate;
    taskToUpdate.roadmaps = roadmaps;

    let assignedAssignee = assignees.find(thisAssignee => assignee.name === thisAssignee.name);
    if (assignedAssignee != null) { //send back error if is null
        taskToUpdate.assignee = assignedAssignee
    }
    else {
        return res.status(400).json({ error: 'Invalid task status provided for task' });
    }
    console.log("task status ", taskStatus);
    let assignedTaskStatus = taskStatusList.find(status => taskStatus.id === status.id);
    if (assignedTaskStatus != null) { //send back error if it is null
        taskToUpdate.taskStatus = assignedTaskStatus;
    }
    else {
        return res.status(400).json({ error: 'Invalid task status provided for milestone' });
    }

    //taskToUpdate.taskStatus = taskStatus; 

    res.json({ message: '[SERVER] Task updated successfully', task: taskToUpdate }); //make better from below 

});

app.post("/api/tasks", (req, res) => {
    const { name, description, roadmaps, assignee, startDate, endDate, taskStatus } = req.body;

    try {
        const newTask =  createTask(name, description, roadmaps, assignee, startDate, endDate, taskStatus);
        if (!newTask) {
            return res.status(400).json({ error: 'Task could not be created' });
        }
        res.status(201).json(newTask);

    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

app.delete("/api/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);

    try {

        const result = deleteTask(id)
        if (result) {
            return res.status(200).json("Task " + id + " is deleted");
        }
        else {
            return res.status(404).json({ error: 'Task not found- id does not match records' });
        }

    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 
//#endregion


//#region Milestones GOOD
app.get("/api/milestones", async (req, res) => {
    const { roadmaps, tags } = req.query;

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String)) ){
        console.log("error: parameters must be in correct format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    const q: string = formatSelectAllFromTable('Milestone');

    const roadmapQ: string =
    `SELECT r.*
    FROM Roadmap r
    JOIN RoadmapMilestone rm ON r.id = rm.roadmap_id
    WHERE rm.milestone_id = $1;`;

    const tagsQ: string =
    `SELECT t.*
    FROM Tag t
    JOIN MilestoneTag mt ON t.id = mt.tag_id
    WHERE mt.milestone_id = $1;`;

    try {
        const list: any[] = await queryPostgres(q);
        if (!list || list.length === 0) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };

        let milestoneList: Milestone[] = [];

        await Promise.all(list.map(async (ms) => {
            const roadmapArray: Roadmap[] = [];

            if (roadmaps === 'true') {
                const roadmapList: any[] = await queryPostgres(roadmapQ, [ms.id]);
                roadmapList.forEach(roadmap => {
                    roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
                });
            };

            const tagArray: Tag[] = [];
            if (tags === 'true') {
                const tagsList: any[] = await queryPostgres(tagsQ, [ms.id]);
                tagsList.forEach(tag => {
                    tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
                });
            };

            milestoneList.push(new Milestone(ms.name, ms.description, ms.date, taskStatusMap['Backlog'],
                ms.id, roadmapArray, tagArray, 'Milestone'));
        }));


        res.send({ message: milestoneList }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching milestones:', err);
        res.status(500).send(formatMessageToClient('Error fetching milestones'));
    };
});

app.get("/api/milestones/:id", async (req, res) => {
    const { roadmaps, tags } = req.query;
    const id = parseInt(req.params.id);

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String))) {
        console.log("error: parameters must be in correct format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for milestones is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Milestone', id);

    const roadmapQ: string =
        `SELECT r.*
        FROM Roadmap r
        JOIN RoadmapMilestone rm ON r.id = rm.roadmap_id
        WHERE rm.milestone_id = $1;`;

    const tagsQ: string =
        `SELECT t.*
        FROM Tag t
        JOIN MilestoneTag mt ON t.id = mt.tag_id
        WHERE mt.milestone_id = $1;`;

    try {
        let queriedItem = await queryPostgres(q);
        const item = queriedItem[0];
        const roadmapArray: Roadmap[] = [];
        if (roadmaps === 'true') {
            const roadmapList: any[] = await queryPostgres(roadmapQ, [item.id]);
            roadmapList.forEach(roadmap => {
                roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
            });
        }

        const tagArray: Tag[] = [];
        if (tags === 'true') {
            const tagsList: any[] = await queryPostgres(tagsQ, [item.id]);
            tagsList.forEach(tag => {
                tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
            });
        };

        const newItem = new Milestone(item.name, item.description, item.date, taskStatusMap['Backlog'],
            item.id, roadmapArray, tagArray, 'Milestone')
            console.log("new item", newItem)
        res.send(newItem);
    } catch (err) {
        console.error('Error fetching milestone:', err);
        res.status(500).send(formatMessageToClient('Error fetching milestone'));
    };
}); 

app.put("/api/milestones/:id", async (req, res) => { 
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for milestone is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Milestone', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching milestone:', err);
        res.status(500).send(formatMessageToClient('Error fetching milestone'));
    };

});
   


app.post("/api/milestones", async (req, res) => {
    const { name, description, date, taskStatus_id } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for milestone ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for milestone ' + name) });
    }
    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({ error: formatMessageToClient('Date format is not correct for milestone ' + name) });
    }
    if (taskStatus_id && !isNumValidator(taskStatus_id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for milestone ' + name + 'is invalid') });
    }


    const q: string = `
    INSERT INTO Milestone (name, description, date, status_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
`;

    try {
        const newItem = await queryPostgres(q, [name, description, date, taskStatus_id]);

        if (newItem.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json({ error: formatMessageToClient('Milestone ' + name + ' could not be created') });
        }
    } catch (err) {
        console.error('Error creating milestone: ' + name, err);
        res.status(500).json({ error: formatMessageToClient('Internal Server Error') });
    }
});


app.delete("/api/milestones/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for assignee is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('Milestone', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json({ message: formatMessageToClient('Milestone deleted successfully') });
        } else {
            res.status(404).json({ error: formatMessageToClient('Milestone not found- does not exist in records') });
        }
    } catch (err) {
        console.error('Error deleting milestone:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 


//#endregion

//#region Assignees GOOD
app.get("/api/assignees", async (req, res) => {
    const q: string = formatSelectAllFromTable('Assignee');

    try {
        const list = await queryPostgres(q);
        if (!list || list.length === 0) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };
        res.send({ message: list }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching assignees:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignees'));
    };
});

app.get("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for assignee is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching assignee:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignee'));
    };
}); 

app.put("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for assignee is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching assignee:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignee'));
    };
});

app.post("/api/assignees", async (req, res) => {
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `
        INSERT INTO Tag (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const newItem = await queryPostgres(q, [name, description]);

        if (newItem.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json({ error: formatMessageToClient('Assignee ' + name + ' could not be created') });
        }
    } catch (err) {
        console.error('Error creating assignee: ' + name, err);
        res.status(500).json({ error: formatMessageToClient('Internal Server Error') });
    }
});


app.delete("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for assignee is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('Assignee', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json({ message: formatMessageToClient('Assignee deleted successfully') });
        } else {
            res.status(404).json({ error: formatMessageToClient('Assignee not found- does not exist in records') });
        }
    } catch (err) {
        console.error('Error deleting assignee:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 

//#endregion

//#region Tags GOOD
app.get("/api/tags", async (req, res) => { 
    const q: string = formatSelectAllFromTable('Tag');

    try {
        const tagList = await queryPostgres(q);
        if (!tagList) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };
        res.send({ message: tagList }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).send(formatMessageToClient('Error fetching tags'));
    };
   // res.send({ message: tags });
});

app.put("/api/tags/:id", async (req, res) => { 
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `UPDATE Tag SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);
        res.status(200).send(item[0]);
    } catch (err) {
        console.error('Error updating unit type item: ' + id, err);
        res.status(500).send(formatMessageToClient('Error updating unit type item ' + id));
    };

});

app.get("/api/tags/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for tag is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Tag', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching tag:', err);
        res.status(500).send(formatMessageToClient('Error fetching tag'));
    };
}); 

app.post("/api/tags", async (req, res) => { 
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `
        INSERT INTO Tag (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try { 
        const newItem = await queryPostgres(q, [name, description]);
        
        if (newItem.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json({ error: formatMessageToClient('Tag ' + name + ' could not be created') });
        }
    } catch (err) {
        console.error('Error creating tag: ' + name, err);
        res.status(500).json({ error: formatMessageToClient('Internal Server Error') });
    }
});


app.delete("/api/tags/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for tag is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('Tag', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json({ message: formatMessageToClient('Tag deleted successfully') });
        } else {
            res.status(404).json({ error: formatMessageToClient('Tag not found- does not exist in records') });
        }
    } catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 
//#endregion

//#region Task Status GOOD
app.get("/api/taskstatus", async (req, res) => {
    const q: string = formatSelectAllFromTable('TaskStatus');

    try {
        const list = await queryPostgres(q);
        if (!list) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };
        res.send({ message: list }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching task status:', err);
        res.status(500).send(formatMessageToClient('Error fetching task status'));
    };
}); 

app.get("/api/taskstatus/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for task status is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('TaskStatus', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching task status:', err);
        res.status(500).send(formatMessageToClient('Error fetching task status'));
    };
}); 

app.put("/api/taskstatus/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `UPDATE TaskStatus SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);
        res.status(200).send(item[0]);
    } catch (err) {
        console.error('Error updating task status: ' + id, err);
        res.status(500).send(formatMessageToClient('Error updating task status ' + id));
    };

});


app.post("/api/taskstatus", async (req, res) => {
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `
        INSERT INTO TaskStatus (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const newItem = await queryPostgres(q, [name, description]);

        if (newItem.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json({ error: formatMessageToClient('Task Status ' + name + ' could not be created') });
        }
    } catch (err) {
        console.error('Error creating task status: ' + name, err);
        res.status(500).json({ error: formatMessageToClient('Internal Server Error') });
    }
});


app.delete("/api/taskstatus/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for task status is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('TaskStatus', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json({ message: formatMessageToClient('Task Status deleted successfully') });
        } else {
            res.status(404).json({ error: formatMessageToClient('Task Status not found- does not exist in records') });
        }
    } catch (err) {
        console.error('Error deleting task status:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 

//#endregion

// #region Roadmaps
app.get("/api/roadmaps", async (req, res) => {

    const q: string = formatSelectAllFromTable('Roadmap');

    try {
        const list: any[] = await queryPostgres(q);
        if (!list) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };

        let roadmapList: Roadmap[] = [];

        list.map(map => { 
            roadmapList.push(
                new Roadmap(map.name, map.description, map.id, 'Roadmap'));
        });

        res.send({ message: roadmapList }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching roadmaps:', err);
        res.status(500).send(formatMessageToClient('Error fetching roadmaps'));
    };
});

app.get("/api/roadmaps/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for roadmap is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Roadmap', id);

    try {
        const item = await queryPostgres(q);
        res.send(item[0]);
    } catch (err) {
        console.error('Error fetching roadmap:', err);
        res.status(500).send(formatMessageToClient('Error fetching roadmap'));
    };
});

app.put("/api/roadmap/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `UPDATE Roadmap SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);
        res.status(200).send(item[0]);
    } catch (err) {
        console.error('Error updating roadmap: ' + id, err);
        res.status(500).send(formatMessageToClient('Error updating roadmap ' + id));
    };

});


app.post("/api/roadmaps", async (req, res) => {
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Name is too long for tag ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json({ error: formatMessageToClient('Description is too long for tag ' + name) });
    }

    const q: string = `
        INSERT INTO Roadmap (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const newItem = await queryPostgres(q, [name, description]);

        if (newItem.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json({ error: formatMessageToClient('Roadmap ' + name + ' could not be created') });
        }
    } catch (err) {
        console.error('Error creating roadmap: ' + name, err);
        res.status(500).json({ error: formatMessageToClient('Internal Server Error') });
    }
});


app.delete("/api/roadmaps/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for roadmap is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('Roadmap', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json({ message: formatMessageToClient('Roadmap deleted successfully') });
        } else {
            res.status(404).json({ error: formatMessageToClient('Roadmap not found- does not exist in records') });
        }
    } catch (err) {
        console.error('Error deleting roadmap:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 

// #endregion

// #region Unit Types
app.get("/api/unittypes", async (req, res) => {
    const q: string = formatSelectAllFromTable('UnitType'); 

    try {
        const unitTypesList = await queryPostgres(q); 
        if (!unitTypesList) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };
        res.send({ message: unitTypesList }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching unit types:', err);
        res.status(500).send(formatMessageToClient('Error fetching unit types'));
    };
});

app.get("/api/unittypes/:id", async (req, res) => { 
    const typeId = parseInt(req.params.id);

    if (!isNumValidator(typeId)) {
        return res.status(400).json({ error: formatMessageToClient('ID for unittype is invalid') });
    }

    const q: string = formatSelectIdfromDatabaseQuery('UnitType', typeId); 

    try { 
        const item = await queryPostgres(q);
        console.log("get id ", item)
        res.send(item[0]); 
    } catch (err) { 
        console.error('Error fetching unit type item:', err);
        res.status(500).send(formatMessageToClient('Error fetching unit type item'));
    }; 
}); 

app.put("/api/unittypes/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json({ error: 'Name is too long' });
    }

    const q: string = `UPDATE UnitType SET name = '${name}' WHERE id = ${id} RETURNING *`;
     
    try {
        const item = await queryPostgres(q);
        res.status(200).send(item[0]);
    } catch (err) {
        console.error('Error updating unit type item:', err);
        res.status(500).send(formatMessageToClient('Error updating unit type item'));
    };

});

// #endregion

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
});


//FOR ID, maybe use a prefix as an identifier? 