import dotenv from "dotenv";
import express, { Request, Response, Express, NextFunction } from 'express';
import taskRoutes from "./routes/taskRoutes";
import milestoneRoutes from "./routes/milestoneRoutes";
import tagRoutes from "./routes/tagRoutes";
import assigneeRoutes from "./routes/assigneeRoutes";
import roadmapRoutes from "./routes/roadmapRoutes";
import unitTypeRoutes from "./routes/unitTypeRoutes";
import taskStatusRoutes from "./routes/taskStatusRoutes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); //parses incoming requests as JSON for POST PUT PATCH from request body
app.use(express.urlencoded({ extended: true }));//parses incoming requests as key-value pairs for GET requests from request.query

//Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/assignees', assigneeRoutes);
app.use('/api/taskStatus', taskStatusRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/unittypes', unitTypeRoutes);


app.get("/", (req: Request, res: Response) => {
    res.send("Kortney's Express + TypeScript Server");
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
});
 