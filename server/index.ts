import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { myDateTime } from './test'
import { Task, TaskStatus } from './Task';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
	res.send("Express + TypeScript Server");
});

let firstTask = new Task(
    'Create Feature Specification',
    'Outline what the feature needs to do',
    'Engineering Roadmap',
    'John Doe',
    new Date('2024-06-15'),
    new Date('2024-06-30')
);

let secondTask = new Task(
    'Create Design Doc',
    'Outline what the feature design is',
    'Design Roadmap',
    'Jane Donut',
    new Date('2024-06-30'),
    new Date('2024-07-30'),
    "In Review"
);

let thirdTask = new Task(
    'Conduct Design Review',
    'Review All Documentation',
    'Engineering Roadmap',
    'Johnny Cakes',
    new Date('2024-08-01'),
    new Date('2024-08-02'),
    'In Progress'
);

let fourthTask = new Task(
    'Create Tasks',
    'Create Tasks In JIRA',
    'Engineering Roadmap',
    'Kendrick Drake',
    new Date('2024-08-03'),
    new Date('2024-08-04'),
    'Backlog'
);

const tasks = [firstTask, secondTask, thirdTask, fourthTask];

/*app.get("/api", (req: Request, res: Response) => {
	res.send({ message: `Hello from the Express + TypeScript Server, man! \n Time: ${myDateTime()} Task:${firstTask.getTaskName()}`});
});*/

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


app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`)
})