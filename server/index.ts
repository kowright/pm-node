import dotenv from "dotenv";
import { myDateTime } from './test'
import { Task, TaskStatus } from './Task';
import express, { Request, Response, Express, NextFunction } from 'express';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); 

app.get("/", (req: Request, res: Response) => {
	res.send("Express + TypeScript Server");
});

let firstTask = new Task(
    'Create Feature Specification',
    'Outline what the feature needs to do',
    'Engineering Roadmap',
    'John Doe',
    new Date('2024-06-15'),
    new Date('2024-06-30'),
    "Backlog",
    1
);

let secondTask = new Task(
    'Create Design Doc',
    'Outline what the feature design is',
    'Design Roadmap',
    'Jane Donuts',
    new Date('2024-06-30'),
    new Date('2024-07-30'),
    "In Review",
    2
);

let thirdTask = new Task(
    'Conduct Design Review',
    'Review All Documentation',
    'Engineering Roadmap',
    'Johnny Cakes',
    new Date('2024-08-01'),
    new Date('2024-08-02'),
    'In Progress',
    3
);

let fourthTask = new Task(
    'Create Tasks',
    'Create Tasks In JIRA',
    'Engineering Roadmap',
    'Kendrick Drake',
    new Date('2024-08-03'),
    new Date('2024-08-04'),
    'Backlog',
    4
);

let fifthTask = new Task(
    'Assign Tasks',
    'Assign People to Tasks',
    'Design Roadmap',
    'Allisa Joan',
    new Date('2024-08-05'),
    new Date('2024-08-07'),
    'In Progress',
    5
);

const tasks = [firstTask, secondTask, thirdTask, fourthTask, fifthTask];

app.get("/api", (req: Request, res: Response) => {
    res.send({ message: tasks });
});

app.get("/group", (req: Request, res: Response) => {
    const tasksByStatus: { [key in TaskStatus]?: Task[] } = tasks.reduce((acc, task) => {
        const status = task.taskStatus;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status]?.push(task);
        return acc;
    }, {} as { [key in TaskStatus]?: Task[] });

    res.send({ message: tasksByStatus });
});

app.put("/api/tasks/:id", (req, res) => {

    const taskId = parseInt(req.params.id);
    const { startDate, duration } = req.body; //Add back taskStatus, name
    //const { name } = req.body; //Add back taskStatus
    // Find the task by ID
    const taskToUpdate = tasks.find(task => task.id === taskId);

    if (!taskToUpdate) {
        return res.status(404).json({ error: 'Task not found' });
    }


    // Update task properties
    //taskToUpdate.name = name;
    taskToUpdate.startDate = startDate;
    //taskToUpdate.taskStatus = status;
    taskToUpdate.duration = duration;

    // Respond with updated task
    res.json({ message: 'Task updated successfully', task: taskToUpdate });

    /*const taskId = parseInt(req.params.id); 
    const { name } = req.body;
    res.json({ message: "good job on task " + taskId + " " + name });*/
});

app.get("/api/tasks/:id", (req, res) => {

    const taskId = parseInt(req.params.id);
    //const { name } = req.body; //Add back taskStatus
    // Find the task by ID
    const task = tasks.find(task => task.id === taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Respond with updated task
    res.json({ message: 'Task updated successfully', task: task });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
});