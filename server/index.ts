import dotenv from "dotenv";
import path from "path";
import { myDateTime } from './test'
import { Task, tasks, createTask, deleteTask} from './Task';
import express, { Request, Response, Express, NextFunction } from 'express';
import Roadmap, { roadmapMap, roadmaps, createRoadmap, deleteRoadmap } from "./Roadmap";
import { taskStatusMap, taskStatusList, createTaskStatus, deleteTaskStatus } from './TaskStatus';
import Assignee, { assigneeMap, assignees, createAssignee, deleteAssignee } from './Assignee';
import { milestones, createMilestone, deleteMilestone } from "./Milestone";
import { tags, createTag, deleteTag, Tag} from './Tag';
const validator = require('validator'); // Example library for input validation


const { Pool } = require('pg');

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); 

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
const idNumValidator = (id:number) => {
    if (isNaN(id) || id <= 0) {
        return false;
    }
    return true;
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

//#region Milestones
app.get("/api/milestones", (req, res) => {
    res.send({ message: milestones }); 
});

app.put("/api/milestones/:id", (req, res) => {
    try {
        const milestoneId = parseInt(req.params.id);
        const { name, description, taskStatus, date, type } = req.body;

        if (type != 'Milestone') {
            return res.status(404).json({ error: 'This is not a milestone- check the API endpoint' });
        } 

        // Find the task by ID
        const milestoneToUpdate = milestones.find(ms => ms.id === milestoneId);

        if (!milestoneToUpdate) {
            return res.status(404).json({ error: 'Milestone not found- id does not match records' });
        }
     
        milestoneToUpdate.name = name;
        milestoneToUpdate.description = description;
        milestoneToUpdate.date = date;
    /*    let assignedTaskStatus = taskStatusList.find(status => taskStatus.name === status.name)
        if (assignedTaskStatus != null) { //send back error if it is null
            milestoneToUpdate.taskStatus = assignedTaskStatus;
        }
        else {
            console.log("couldn't assign task status")
        } 
         */
        let assignedTaskStatus = taskStatusList.find(status => taskStatus.id === status.id);
        if (assignedTaskStatus != null) { //send back error if it is null
            milestoneToUpdate.taskStatus = assignedTaskStatus;
        }
        else {
            return res.status(400).json({ error: 'Invalid task status provided for milestone' });
        }
      
        res.status(200).json(milestoneToUpdate);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    };


    app.post("/api/milestones", (req, res) => {
        const { name, description, date, taskStatus } = req.body;

        try {
            const newMilestone = createMilestone(name, description, date, taskStatus);
            if (!newMilestone) {
                return res.status(400).json({ error: 'Milestone could not be created' });
            }
            res.status(201).json(newMilestone);

        } catch (err) {
            console.error('Error creating Milestone:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    app.delete("/api/milestones/:id", (req, res) => {
        const id = parseInt(req.params.id);

        try {

            const result = deleteMilestone(id)
            if (result) {
                return res.status(200).json("Milestone " + id + " is deleted");
            }
            else {
                return res.status(404).json({ error: 'Milestone not found- id does not match records' });
            }

        } catch (err) {
            console.error('Error deleting Milestone:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }); 

});
//#endregion

//#region Assignees
app.get("/api/assignees", (req, res) => {
    res.send({ message: assignees });
});

app.put("/api/assignees/:id", (req, res) => {
    try {
        const assigneeId = parseInt(req.params.id);
        const { name, description, type } = req.body;

        if (type != 'Assignee') {
            return res.status(404).json({ error: 'This is not an assignee- check the API endpoint' });
        }

        const assigneeToUpdate = tags.find(ms => ms.id === assigneeId);
        if (!assigneeToUpdate) {
            return res.status(404).json({ error: 'assignee not found- id does not match records' });
        }

        assigneeToUpdate.name = name;
        assigneeToUpdate.description = description;

        res.status(200).json(assigneeToUpdate);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    };

});

app.post("/api/assignees", (req, res) => {
    const { name, description } = req.body;

    try {
        const newAssignee = createAssignee(name, description);
        if (!newAssignee) {
            return res.status(400).json({ error: 'Assignee could not be created' });
        }
        res.status(201).json(newAssignee);

    } catch (err) {
        console.error('Error creating assignee:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete("/api/assignees/:id", (req, res) => {
    const id = parseInt(req.params.id);

    try {

        const result = deleteAssignee(id)
        if (result) {
            return res.status(200).json("Assignee " + id + " is deleted");
        }
        else {
            return res.status(404).json({ error: 'Assignee not found- id does not match records' });
        }

    } catch (err) {
        console.error('Error deleting assignee:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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
    res.send({ message: tags });
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

    if (!idNumValidator(id)) {
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

    if (!idNumValidator(id)) {
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

//#region Task Status
app.get("/api/taskstatus", async (req, res) => {
    const q: string = 'SELECT * FROM TaskStatus';

    try {
        const taskStatusList = await queryPostgres(q); 
        console.log('task status ' + taskStatusList)
        if (!taskStatusList) {
            res.status(400).send('Error with query; no results returned');
        }
        res.send({ message: taskStatusList }); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching task statuses:', err);
        res.status(500).send('Error fetching task statuses');
    };
}); 

app.put("/api/taskstatus/:id", (req, res) => { //need to give taskStatus id
    try {
        const milestoneId = parseInt(req.params.id);
        const { name, description, taskStatus } = req.body;
        // Find the task by ID
        const milestoneToUpdate = milestones.find(ms => ms.id === milestoneId);

        if (!milestoneToUpdate) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        milestoneToUpdate.name = name;
        milestoneToUpdate.description = description;
        // milestoneToUpdate.date = date;
        milestoneToUpdate.taskStatus = taskStatus;

        // Respond with status code 200 (OK)
        res.status(200).json(milestoneToUpdate);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    };
});

app.post("/api/taskstatus", (req, res) => {
    const { name, description } = req.body;

    try {
        const newStatus = createTaskStatus(name, description);
        if (!newStatus) {
            return res.status(400).json({ error: 'Task Status could not be created' });
        }
        res.status(201).json(newStatus);

    } catch (err) {
        console.error('Error creating task status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete("/api/taskstatus/:id", (req, res) => {
    const id = parseInt(req.params.id);

    try {

        const result = deleteTaskStatus(id)
        if (result) {
            return res.status(200).json("Task Status " + id + " is deleted");
        }
        else {
            return res.status(404).json({ error: 'Task Status not found- id does not match records' });
        }

    } catch (err) {
        console.error('Error deleting task status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

//#endregion

// #region Roadmaps
app.get("/api/roadmaps", (req, res) => {
    res.send({ message: roadmaps }); //remove message and fix frontend
});

app.post("/api/roadmaps", (req, res) => {
    const { name, description, milestones, tags } = req.body;

    try {
        const newRoadmap = createRoadmap(name, description, milestones, tags);
        if (!newRoadmap) {
            return res.status(400).json({ error: 'Roadmap could not be created' });
        }
        res.status(201).json(newRoadmap);

    } catch (err) {
        console.error('Error creating Roadmap:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete("/api/roadmaps/:id", (req, res) => {
    const id = parseInt(req.params.id);

    try {

        const result = deleteRoadmap(id)
        if (result) {
            return res.status(200).json("Roadmap " + id + " is deleted");
        }
        else {
            return res.status(404).json({ error: 'Roadmap not found- id does not match records' });
        }

    } catch (err) {
        console.error('Error deleting Roadmap:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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

    if (!idNumValidator(typeId)) {
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