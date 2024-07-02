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

const { Client } = require('pg');

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); 

const postgresClient = new Client({ 
    user: 'postgres',
    host: 'localhost',
    database: 'Tags',
    password: process.env.POSTGRES_PASSWORD, 
    port: 5432, // default PostgreSQL port
});

async function connect() {
    try {
        await postgresClient.connect();
        console.log('Connected to PostgreSQL');
        await selectFromMembership();
    } catch (err) {
        console.error('Connection error', err);
    } finally {
        await postgresClient.end();
        console.log('Disconnected from PostgreSQL');
    }
};

// Function to perform SELECT * FROM membership query
async function selectFromMembership() {
    try {
        const res = await postgresClient.query('SELECT * FROM membership');
        console.log('Query result:', res.rows);
        // Process the rows returned by the query here
    } catch (err) {
        console.error('Error executing query', err);
    }
}

// Call connect() to start the process
connect();

app.get("/", (req: Request, res: Response) => {
	res.send("Kortney's Express + TypeScript Server");
});


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

//#region Tags
app.get("/api/tags", (req, res) => {
    res.send({ message: tags });
});

app.put("/api/tags/:id", (req, res) => {
    try {
        const tagId = parseInt(req.params.id);
        const { name, description, type } = req.body;

        if (type != 'Tag') {
            return res.status(404).json({ error: 'This is not a tag- check the API endpoint' });
        }

        const tagToUpdate = tags.find(ms => ms.id === tagId);
        if (!tagToUpdate) {
            return res.status(404).json({ error: 'Tag not found- id does not match records' });
        }

        tagToUpdate.name = name;
        tagToUpdate.description = description;
 
        res.status(200).json(tagToUpdate);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    };
});

app.post("/api/tags", (req, res) => {
    const { name, description } = req.body;

    try {
        const newTag = createTag(name, description);
        if (!newTag) {
            return res.status(400).json({ error: 'Tag could not be created' });
        }
        res.status(201).json(newTag);

    } catch (err) {
        console.error('Error creating tag:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete("/api/tags/:id", (req, res) => {
    const id = parseInt(req.params.id);

    try {
        
        const result = deleteTag(id)
        if (result) {
            return res.status(200).json("Tag " + id + " is deleted");
        }
        else {
            return res.status(404).json({ error: 'Tag not found- id does not match records' });
        }

    } catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 
//#endregion

//#region Task Status
app.get("/api/taskstatus", (req, res) => {
    res.send({ message: taskStatusList }); //remove message and fix frontend
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


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
});


//FOR ID, maybe use a prefix as an identifier? 