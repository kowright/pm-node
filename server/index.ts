import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { myDateTime } from './test'
import Task from './Task';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
	res.send("Express + TypeScript Server");
});

let firstTask = new Task(
    'Create Feature Specification',
    'Outline what the feature needs to do',
    15,
    'Engineering Roadmap',
    'John Doe',
    new Date('2024-06-15'),
    new Date('2024-06-30')
);

let secondTask = new Task(
    'Create Design Doc',
    'Outline what the feature design is',
    30,
    'Design Roadmap',
    'Jane Donut',
    new Date('2024-06-30'),
    new Date('2024-07-30')
);

let thirdTask = new Task(
    'Conduct Design Review',
    'Review All Documentation',
    1,
    'Engineering Roadmap',
    'Johnny Cakes',
    new Date('2024-08-01'),
    new Date('2024-08-02')
);

const tasks = [firstTask, secondTask, thirdTask];

/*app.get("/api", (req: Request, res: Response) => {
	res.send({ message: `Hello from the Express + TypeScript Server, man! \n Time: ${myDateTime()} Task:${firstTask.getTaskName()}`});
});*/

app.get("/api", (req: Request, res: Response) => {
    res.send({ message: tasks });
});

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`)
})