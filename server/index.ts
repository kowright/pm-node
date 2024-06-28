import dotenv from "dotenv";
import { myDateTime } from './test'
import { Task } from './Task';
import express, { Request, Response, Express, NextFunction } from 'express';
import Roadmap, { roadmapMap, roadmaps } from "./Roadmap";
import { taskStatusMap, taskStatusList } from './TaskStatus';
import Assignee, { assigneeMap, assignees } from './Assignee';
import { milestones } from "./Milestone";
import { tags } from './Tag';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); 

app.get("/", (req: Request, res: Response) => {
	res.send("Kortney's Express + TypeScript Server");
});

let firstTask = new Task(
    'Create Feature Specification',
    'Outline what the feature needs to do',
    [ roadmapMap['Engineering'] ], 
    assigneeMap['John Doe'],
    new Date('2024-06-15'),
    new Date('2024-06-30'),
    taskStatusMap['Backlog'],
    1
);

let secondTask = new Task(
    'Create Design Doc',
    'Outline what the feature design is',
    [roadmapMap['Design']], 
    assigneeMap['Jane Donuts'],
    new Date('2024-06-30'),
    new Date('2024-07-30'),
    taskStatusMap['In Review'],
    2
);

let thirdTask = new Task(
    'Conduct Design Review',
    'Review All Documentation',
    [roadmapMap['Engineering']], 
    assigneeMap['Johnny Cakes'],
    new Date('2024-08-01'),
    new Date('2024-08-02'),
    taskStatusMap['In Progress'],
    3
);

let fourthTask = new Task(
    'Create Tasks',
    'Create Tasks In JIRA',
    [roadmapMap['Engineering']], 
    assigneeMap['Kendrick Drake'],
    new Date('2024-08-03'),
    new Date('2024-08-04'),
    taskStatusMap['Backlog'],
    4
);

let fifthTask = new Task(
    'Assign Tasks',
    'Assign People to Tasks',
    [ roadmapMap['Engineering'], roadmapMap['Design'] ], 
    assigneeMap['Allisa Joan'],
    new Date('2024-08-05'),
    new Date('2024-08-07'),
    taskStatusMap['In Progress'],
    5
);
 
const tasks: Task[] = [
    firstTask,
    secondTask,
    thirdTask,
    fourthTask,
    fifthTask
];

//#region Tasks
app.get("/api/tasks", (req: Request, res: Response) => {
    res.send({ message: tasks });
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
    taskToUpdate.name = name;
    taskToUpdate.startDate = startDate;
    taskToUpdate.description = description;
    taskToUpdate.endDate = endDate;
    taskToUpdate.roadmaps = roadmaps;

    let assignedAssignee = assignees.find(thisAssignee => assignee.name === thisAssignee.name)
    if (assignedAssignee != null) { //send back error if is null
        taskToUpdate.assignee = assignedAssignee
    }
    else {
        return res.status(400).json({ error: 'Invalid task status provided for task' });
    }

    let assignedTaskStatus = taskStatusList.find(status => taskStatus === status.name)
    if (assignedTaskStatus != null) { //send back error if it is null
        taskToUpdate.taskStatus = assignedTaskStatus;
    }
    else {
        return res.status(400).json({ error: 'Invalid task status provided for milestone' });
    }

    //taskToUpdate.taskStatus = taskStatus; 

    // Respond with updated task
    res.json({ message: '[SERVER] Task updated successfully', task: taskToUpdate }); //make better from below 

    /*const taskId = parseInt(req.params.id); 
    const { name } = req.body;
    res.json({ message: "good job on task " + taskId + " " + name });*/

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
     /*   let assignedTaskStatus = taskStatusList.find(status => taskStatus.name === status.name)
        if (assignedTaskStatus != null) { //send back error if it is null
            milestoneToUpdate.taskStatus = assignedTaskStatus;
        }
        else {
            console.log("couldn't assign task status")
        }*/ 
         
        let assignedTaskStatus = taskStatusList.find(status => taskStatus === status.name)
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
//#endregion

//#region Task Status
app.get("/api/taskstatus", (req, res) => {
    res.send({ message: taskStatusList });
});

/*app.put("/api/taskstatus/:id", (req, res) => { //need to give taskStatus id
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
});*/

//#endregion

app.get("/api/roadmaps", (req, res) => {
    res.send({ message: roadmaps });
});


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
});


//FOR ID, maybe use a prefix as an identifier? 