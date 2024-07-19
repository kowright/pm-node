import dotenv from "dotenv";
import express, { Request, Response, Express, NextFunction } from 'express';
import { Task } from './Task';
import Roadmap from "./Roadmap";
import TaskStatus from './TaskStatus';
import Assignee from './Assignee';
import Milestone from "./Milestone";
import { Tag } from './Tag';
import axios from 'axios';

const validator = require('validator'); 
const dayjs = require('dayjs');
const { Pool } = require('pg');

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); //parses incoming requests as JSON for POST PUT PATCH from request body
app.use(express.urlencoded({ extended: true }));//parses incoming requests as key-value pairs for GET requests from request.query


// #region Message Formatters
//for distinguishing logs from backend on the frontend
function formatMessageToClient(text: string): string;
function formatMessageToClient(text: string, err: any): string;

// Implementation of the function
function formatMessageToClient(text: string, err?: any): string {
    if (err !== undefined) {
        return `[SERVER] ${text} | ${err}`;
    } else {
        return `[SERVER] ${text}`;
    }
}

//for stack trace
function formatMessageToServer(loggerName: string, text: string): void;
function formatMessageToServer(loggerName: string, text: string, err: any): void;
function formatMessageToServer(loggerName: string, text: string, err?: any): void {
    if (err !== undefined) {
        console.log(`[${loggerName}]: ${text} | ${err}`);
    } else {
        console.log(`[${loggerName}]: ${text}`);
    }
}

function formatQuerySingleUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for " + singleUnitName + " id " + id, err);
    res.status(400).send(formatMessageToClient('Error with query; no results returned'));
}

function formatQueryAllUnitsErrorMessage(pluralUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for all " + pluralUnitName, err);
    res.status(400).send(formatMessageToClient('Error with query; no results returned'));
}

function formatQueryDeleteUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't find ID " + id + " for " + singleUnitName, err);
    res.status(404).json(formatMessageToClient(singleUnitName + ' not found- does not exist in records'));
}
// #endregion

//TODO make PUT requests just send the same thing back
//TODO make POST requests call GET API
//TODO replace validations

// #region Fetching Other Endpoints
const fetchData = async (suffix: string) => {
    const url = 'http://localhost:3001' + suffix;
    console.log("fetch url", url)
    try {
        const response = await axios.get('http://localhost:3001' + suffix, {
     
        });
        if (response.status !== 200) {
            throw new Error(`HTTP error on endpoint call! Status: ${response.status}`);
        }

        const data = response.data;
        return (data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// #endregion

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

// #region Validators
const isNumValidator = (id: number) => {
    if (isNaN(id) || id <= 0) {
        return false;
    }
    return true;
};

const isBooleanStringValidator = (i: any) => {
    return i === 'true' || i === 'false'
};

function isArrayOfNumbersValidator(tags: any): boolean {
    if (!Array.isArray(tags)) {
        return false; // Not an array
    }

    for (let i = 0; i < tags.length; i++) {
        if (typeof tags[i] !== 'number' || isNaN(tags[i])) {
            return false; // Element is not a number or NaN
        }
    }

    return true; // All elements are numbers
}

function checkStringInputValidator(stringType: string, name: string, loggerName: string, res: Response) {
    if (!validator.isLength(name, { max: 255 })) {
        formatMessageToServer(loggerName, stringType + " is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Name is too long for task ' + name) });
    }
}

function checkDateInputValidator(dateTitle: string, dateValue: string, loggerName: string, res: Response) {
    if (!dayjs(dateValue, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, dateTitle + ' format is not correct: ' + dateValue);
        return res.status(400).json({ error: formatMessageToClient(dateTitle + ' format is not correct: ' + dateValue) });
    }
}

function checkNumberInputValidator(num: any, clientMessage: string, loggerName: string, res: Response) {
    if(!isNumValidator(num)) {
        formatMessageToServer(loggerName, num + ' is not a number');
        return res.status(400).json({ error: formatMessageToClient(clientMessage) });
    }
}

function checkArrayOfNumbersInputValidator(arrayName: string, array: any[], loggerName: string,res: Response) {
    if (!isArrayOfNumbersValidator(array)) {
        formatMessageToServer(loggerName, arrayName + ' is not an array of numbers')
        return res.status(400).json({ error: formatMessageToClient('Params for milestone ' + arrayName + 'is invalid') });
    }
}

// #endregion

//#region Tasks 
app.get("/api/tasks", async (req: Request, res: Response) => {
    const { roadmaps, tags } = req.query;

    const loggerName = 'TASKS GET';

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String))) {
        formatMessageToServer(loggerName, "parameters didn't pass validator");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    // #region Queries

    const roadmapQ: string = `
    SELECT r.*
    FROM Roadmap r
    JOIN TaskRoadmap tr ON r.id = tr.roadmap_id
    WHERE tr.task_id = $1;`;

    const tagsQ: string =`
    SELECT t.*
    FROM Tag t
    JOIN TaskTag tt ON t.id = tt.tag_id
    WHERE tt.task_id = $1;`;

    const getEverything = `
    SELECT
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.start_date,
        t.end_date,
        a.id AS assignee_id,
        a.name AS assignee_name,
        a.description AS assignee_description,
        a.type_id AS assignee_type_id,
        ts.id AS task_status_id,
        ts.name AS task_status_name,
        ts.description AS task_status_description,
        ts.type_id AS task_status_type_id,
        ty.id AS type_id,
        ty.name AS type_name
    FROM
        Task t
    JOIN
        Assignee a ON t.assignee_id = a.id
    JOIN
        TaskStatus ts ON t.status_id = ts.id
    JOIN
        UnitType ty ON t.type_id = ty.id;
    `;

    // #endregion

    let tasks: any[] = [];
    try {
        tasks = await queryPostgres(getEverything);
    } catch (err) {
        formatMessageToServer(loggerName, "nothing came back for task from postgres", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }

    let taskList: Task[] = [];

    await Promise.all(tasks.map(async (t) => {
        const roadmapArray: Roadmap[] = [];

        try {
            if (roadmaps === 'true') {
                const roadmapList: any[] = await queryPostgres(roadmapQ, [t.task_id]);

                roadmapList.forEach(roadmap => {
                    roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "nothing came back for roadmapQ from postgres", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }

        const tagArray: Tag[] = [];
        try {
            if (tags === 'true') {
                const tagsList: any[] = await queryPostgres(tagsQ, [t.task_id]);
                tagsList.forEach(tag => {
                    tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "nothing came back for tagQ from postgres", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }

        const assignee = new Assignee(t.assignee_name, t.assignee_description, t.assignee_id, t.assignee_type_id);
        const taskStatus = new TaskStatus(t.task_status_name, t.task_status_description, t.task_status_id, t.task_status_type_id);

        taskList.push(new Task(t.task_name, t.task_description, roadmapArray, tagArray, assignee,
            t.start_date, t.end_date, taskStatus, t.task_id, t.type_id));
    }));

    res.status(200).send(taskList);
    
});

app.get("/api/tasks/:id", async (req, res) => {
    const { roadmaps, tags } = req.query;

    const id = parseInt(req.params.id);

    const loggerName = 'TASKS ID GET';

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String))) {
        formatMessageToServer(loggerName, "parameters didn't pass validator");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    // #region Queries

    const roadmapQ: string = `
    SELECT r.*
    FROM Roadmap r
    JOIN TaskRoadmap tr ON r.id = tr.roadmap_id
    WHERE tr.task_id = $1;`;

    const tagsQ: string = `
    SELECT t.*
    FROM Tag t
    JOIN TaskTag tt ON t.id = tt.tag_id
    WHERE tt.task_id = $1;`;

    const getEverything = `
    SELECT
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.start_date,
        t.end_date,
        a.id AS assignee_id,
        a.name AS assignee_name,
        a.description AS assignee_description,
        a.type_id AS assignee_type_id,
        ts.id AS task_status_id,
        ts.name AS task_status_name,
        ts.description AS task_status_description,
        ts.type_id AS task_status_type_id,
        ty.id AS type_id,
        ty.name AS type_name
    FROM
        Task t
    JOIN
        Assignee a ON t.assignee_id = a.id
    JOIN
        TaskStatus ts ON t.status_id = ts.id
    JOIN
        UnitType ty ON t.type_id = ty.id
        WHERE
    t.id = $1;
    `;

    // #endregion

    let tasks: any[] = [];
    try {
        tasks = await queryPostgres(getEverything, [id]);
    } catch (err) {
        formatMessageToServer(loggerName, "nothing came back from postgres for task", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }

    const t = tasks[0];

    const roadmapArray: Roadmap[] = [];
    try {
        if (roadmaps === 'true') {
            const roadmapList: any[] = await queryPostgres(roadmapQ, [t.task_id]);

            roadmapList.forEach(roadmap => {
                roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
            });
        };
    } catch (err) {
        formatMessageToServer(loggerName, "nothing came back from roadmapQ postgres for task", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }
   
    const tagArray: Tag[] = [];
    try {
        if (tags === 'true') {
            const tagsList: any[] = await queryPostgres(tagsQ, [t.task_id]);
            tagsList.forEach(tag => {
                tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
            });
        };
    } catch (err) {
        formatMessageToServer(loggerName, "nothing came back from tagQ postgres for task", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }
  
    const assignee = new Assignee(t.assignee_name, t.assignee_description, t.assignee_id, t.assignee_type_id);
    const taskStatus = new TaskStatus(t.task_status_name, t.task_status_description, t.task_status_id, t.task_status_type_id);
    const task = new Task(t.task_name, t.task_description, roadmapArray, tagArray, assignee, t.start_date,
        t.end_date, taskStatus, t.task_id, t.type_id);

    res.status(200).send(task);
});

app.put("/api/tasks/:id", async (req, res) => {  //TODO CLEAN UP 
    const loggerName = 'TASKS ID PUT';
    const id = parseInt(req.params.id);

    const { name, description, assignee, startDate, endDate, tags, roadmaps } = req.body;
    const putTask: Task = req.body;

    // #region Validation
    //TODO use putTask.<thing>
    if (!validator.isLength(name, { max: 255 })) {
        formatMessageToServer(loggerName, "Name is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Name is too long for task ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        formatMessageToServer(loggerName, "Description is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Description is too long for task ' + name) });
    }
    if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, "Start date format is not correct for task " + name);
        return res.status(400).json({ error: formatMessageToClient('Start date format is not correct for task ' + name) });
    }
    if (!dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, "End date format is not correct for task " + name);
        return res.status(400).json({ error: formatMessageToClient('Date format is not correct for task ' + name) });
    }
    /*if (taskStatusId && !isNumValidator(taskStatusId)) { //WHY NO STATUS
        return res.status(400).json({ error: formatMessageToClient('ID for task ' + name + 'is invalid') });
    }*/
    if (tags) {
        const sentTags = tags as Tag[];
        const tagIds = sentTags.map(tag => tag.id);
        if (!isArrayOfNumbersValidator(tagIds)) {
            formatMessageToServer(loggerName, "Tags couldn't be extracted from " + tags + " for " + name);
            return res.status(400).json({ error: formatMessageToClient('Params for task ' + name + 'is invalid') });
        }
    }        
    if (roadmaps) {
        const sentRoadmaps = roadmaps as Roadmap[];
        const roadmapIds = sentRoadmaps.map(map => map.id);
        if (!isArrayOfNumbersValidator(roadmapIds)) {
            formatMessageToServer(loggerName, "Roadmaps couldn't be extracted from " + roadmaps + " for " + name);
            return res.status(400).json({ error: formatMessageToClient('Params for task ' + name + 'is invalid') });
        }
    }    
    if (!isNumValidator(id)) {
        formatMessageToServer(loggerName, "ID is not a number");
        return res.status(400).json({ error: formatMessageToClient('ID for task is invalid') });
    }
   /* if (assignee) {
        if (!isNumValidator((assignee as Assignee).id)) {
            return res.status(400).json({ error: formatMessageToClient('ID for assignee is invalid') });
        }
    }*/

    // #endregion
    // #region Queries 
    const insertRowIntoTaskTagQ = `
    INSERT INTO TaskTag (task_id, tag_id)
    VALUES ($1, $2)
    `;

    const insertRowIntoTaskRoadmapQ = `
    INSERT INTO TaskRoadmap (task_id, roadmap_id)
    VALUES ($1, $2)
    `;

    const updateTaskQ = `
    UPDATE Task
    SET name = $1,
        description = $2,
        start_date = $3,
        end_date = $4,
        assignee_id = $5,
        status_id = $6
    WHERE id = $7
    RETURNING *;
  `;

    const getAllRowsFromTaskTagByTaskIdQ = `
    SELECT *
    FROM TaskTag
	WHERE task_id = $1;
    ` ;

    const getAllRowsFromTaskRoadmapByTaskIdQ = `
    SELECT *
    FROM TaskRoadmap
	WHERE task_id = $1;
    ` ;

    const deleteRowFromTaskTagQ = `
    DELETE FROM TaskTag WHERE task_id = $1 AND tag_id = $2
    `;

    const deleteRowFromTaskRoadmapQ = `
    DELETE FROM TaskRoadmap WHERE task_id = $1 AND roadmap_id = $2
    `;

    // #endregion

    try {
        //TODO split into multiple try catch
        const item = await queryPostgres(updateTaskQ, [name, description, startDate, endDate, assignee.id, putTask.taskStatus.id, id]);

        //tags
        const dbTagRows: any[] = await queryPostgres(getAllRowsFromTaskTagByTaskIdQ, [id]);
  
        const tagArrayFromParams: Tag[] = Array.isArray(tags) ? tags : JSON.parse(tags);
        let newTagRows: any[] = [];
        tagArrayFromParams.map(tag => {
            newTagRows.push({
                task_id: id,
                tag_id: tag.id
            });
        });

        const rowsToDelete = dbTagRows.filter(dbRow =>
            !newTagRows.some(newRow => newRow.task_id === dbRow.task_id && newRow.tag_id === dbRow.tag_id)
        );

        const rowsToInsert = newTagRows.filter(newRow =>
            !dbTagRows.some(dbRow => dbRow.task_id === newRow.task_id && dbRow.tag_id === newRow.tag_id)
        );

        await Promise.all(rowsToDelete.map(async row => {
            await queryPostgres(deleteRowFromTaskTagQ, [row.task_id, row.tag_id]);
        }));

        await Promise.all(rowsToInsert.map(async row => {
            await queryPostgres(insertRowIntoTaskTagQ, [row.task_id, row.tag_id]);
        }));

        //roadmaps
        const dbRoadmapRows: any[] = await queryPostgres(getAllRowsFromTaskRoadmapByTaskIdQ, [id]);
        let roadmapArrayFromParams: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
        roadmapArrayFromParams = putTask.roadmaps.map(map => map.id);
        let newRoadmapRows: any[] = [];
        roadmapArrayFromParams.map(map => {
            newRoadmapRows.push({
                roadmap_id: map,
                task_id: id
            });
        });

        const roadmapRowsToDelete = dbRoadmapRows.filter(dbRow =>
            !newTagRows.some(newRow => newRow.task_id === dbRow.task_id && newRow.roadmap_id === dbRow.roadmap_id)
        );
        const roadmapRowsToInsert = newRoadmapRows.filter(newRow =>
            !dbTagRows.some(dbRow => dbRow.task_id === newRow.task_id && dbRow.roadmap_id === newRow.roadmap_id)
        );

        await Promise.all(roadmapRowsToDelete.map(async row => {
            await queryPostgres(deleteRowFromTaskRoadmapQ, [row.task_id, row.roadmap_id]);
        }));

        await Promise.all(roadmapRowsToInsert.map(async row => {
            await queryPostgres(insertRowIntoTaskRoadmapQ, [row.task_id, row.roadmap_id,]);
        }));


        if (item.length > 0) {
            formatMessageToServer(loggerName, "nothing returned from postgres");
            res.status(201).json(putTask); //hmm eh 
        } else {
            console.log('Error updating task');
            res.status(400).json(formatMessageToClient('Task ' + name + ' could not be updated'));
        }
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).send(formatMessageToClient('Error fetching task'));
    };

    
});

app.post("/api/tasks", async (req, res) => {
    const { name, description, startDate, endDate, assignee, taskStatus, tags, roadmaps } = req.body;
    const loggerName = 'TASKS POST';

    // #region Validation
    if (!validator.isLength(name, { max: 255 })) {
        formatMessageToServer(loggerName, "Name is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Name is too long for task ' + name) });
    }
    if (!validator.isLength(description, { max: 255 })) {
        formatMessageToServer(loggerName, "Description is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Description is too long for task ' + name) });
    }
    if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, "Start date format is not a date " + name);
        return res.status(400).json({ error: formatMessageToClient('Date format is not correct for task ' + name) });
    }
    if (!dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, "End date format is not a date " + name);
        return res.status(400).json({ error: formatMessageToClient('Date format is not correct for task  ' + name) });
    }
    if (taskStatus && !isNumValidator(taskStatus)) {
        formatMessageToServer(loggerName, "task status id is not a numberfor " + name);
        return res.status(400).json({ error: formatMessageToClient('ID for task  ' + name + 'is invalid') });
    } 
    if (assignee && !isNumValidator(assignee)) {
        formatMessageToServer(loggerName, "assignee id is not a number for " + name);
        return res.status(400).json({ error: formatMessageToClient('ID for task  ' + name + 'is invalid') });
    }
    if (!isArrayOfNumbersValidator(tags)) {
        formatMessageToServer(loggerName, "tags are not an array of numbers for " + name);
        return res.status(400).json({ error: formatMessageToClient('Params for task  ' + name + 'is invalid') });
    }
    if (!isArrayOfNumbersValidator(roadmaps)) {
        formatMessageToServer(loggerName, "roadmaps are not an array of numbers for " + name);
        return res.status(400).json({ error: formatMessageToClient('Params for task  ' + name + 'is invalid') });
    }
    // #endregion

    // #region Queries 

    const q: string = `
    INSERT INTO Task (name, description, start_date, end_date, assignee_id, status_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
`;

    const insertIntoTaskTag = `
    INSERT INTO TaskTag (task_id, tag_id)
    VALUES ($1, $2)
    `

    const insertIntoTaskRoadmap = `
    INSERT INTO TaskRoadmap (task_id, roadmap_id)
    VALUES ($1, $2)
    `

    const roadmapQ: string = `
    SELECT r.*
    FROM Roadmap r
    JOIN TaskRoadmap tr ON r.id = tr.roadmap_id
    WHERE tr.task_id = $1;`;

    const tagsQ: string = `
    SELECT t.*
    FROM Tag t
    JOIN TaskTag tt ON t.id = tt.tag_id
    WHERE tt.task_id = $1;`;

    const getEverything = `
    SELECT
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.start_date,
        t.end_date,
        a.id AS assignee_id,
        a.name AS assignee_name,
        a.description AS assignee_description,
        a.type_id AS assignee_type_id,
        ts.id AS task_status_id,
        ts.name AS task_status_name,
        ts.description AS task_status_description,
        ts.type_id AS task_status_type_id,
        ty.id AS type_id,
        ty.name AS type_name
    FROM
        Task t
    JOIN
        Assignee a ON t.assignee_id = a.id
    JOIN
        TaskStatus ts ON t.status_id = ts.id
    JOIN
        UnitType ty ON t.type_id = ty.id
        WHERE
    t.id = $1;
    `;

    // #endregion

    //establish postgres tables with new info
    let newItem: any;
    try {
        newItem = await queryPostgres(q, [name, description, startDate, endDate, assignee, taskStatus]);
    } catch (err) {
        formatMessageToServer(loggerName, "insert into query failed", err);
        res.status(400).json(formatMessageToClient('Error with query', err));
    }

    // let clientMessage: string = 'Task successfully made.\n';

    const tagArray: number[] = Array.isArray(tags) ? tags : JSON.parse(tags);
    await Promise.all(tagArray.map(async (tagId) => {
        try {
            await queryPostgres(insertIntoTaskTag, [newItem[0].id, tagId]);
        }
        catch (err: any) {
            if (err.code === '23505') {
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name, err);
               // clientMessage += 'Tag is already attached to task \n'
            }
            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name. err);
               // clientMessage += 'Tags given does not exist but task still was made. \n'
            }
        }
    }));

    const roadmapArray: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
    await Promise.all(roadmapArray.map(async (mapId) => {
        try {
            await queryPostgres(insertIntoTaskRoadmap, [newItem[0].id, mapId]);
        }
        catch (err: any) {
            if (err.code === '23505') {
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name);
               // clientMessage += 'Roadmap is already attached to task.\n'
            }
            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Roadmaps given don't exist but item was still made for " + name);
               // clientMessage += 'Roadmaps given does not exist but task still was made. \n'
            }
        }
    }));

    //get everything from postgres to make task
    const t = newItem[0];

    const roadmapGetArray: Roadmap[] = [];
    try {
        const roadmapList: any[] = await queryPostgres(roadmapQ, [t.id]);
        roadmapList.forEach(roadmap => {
            roadmapGetArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type_id));
        });
    } catch (err) {
        formatMessageToServer(loggerName, "roadmapQ failed", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }

    const tagGetArray: Tag[] = [];
    try {
        const tagsList: any[] = await queryPostgres(tagsQ, [t.id]);
        tagsList.forEach(tag => {
            tagGetArray.push(new Tag(tag.name, tag.description, tag.id, tag.type_id));
        });
    } catch (err) {
        formatMessageToServer(loggerName, "tagQ failed", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }

    let fullTaskObj: any;
    try {
        fullTaskObj = await queryPostgres(getEverything, [t.id]);
    } catch (err) {
        formatMessageToServer(loggerName, "full Task is empty from postgres", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
    }

    const fullTask = fullTaskObj[0];

    const as = new Assignee(fullTask.assignee_name, fullTask.assignee_description, fullTask.assignee_id, fullTask.assignee_type_id); 
    const ts = new TaskStatus(fullTask.task_status_name, fullTask.task_status_description, fullTask.task_status_id, fullTask.task_status_type_id); 

    const task = new Task(fullTask.task_name, fullTask.task_description, roadmapGetArray, tagGetArray,
        as, fullTask.start_date, fullTask.end_date, ts, fullTask.task_id, fullTask.type_id);

    res.status(201).json(task);
}); 

app.delete("/api/tasks/:id", async (req, res) => {
    const loggerName = 'TASKS DELETE';
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        formatMessageToServer(loggerName, "Id given isn't a number");
        return res.status(400).json({ error: formatMessageToClient('ID for task is invalid') });
    }

    const q = formatDeleteIdfromDatabaseQuery('Task', id);

    try {
        await queryPostgres(q);
        res.status(200).json('deleted'); 
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't delete task id " + id, err);
        res.status(404).json(formatMessageToClient('Task not found- does not exist in records', err));
    };
}); 
//#endregion

//#region Milestones 
app.get("/api/milestones", async (req, res) => {
    const { roadmaps, tags } = req.query;

    const loggerName = 'MILESTONES GET';

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String))) {
        console.log("error: parameters must be in correct format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    // #region Queries 

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

    const taskStatusQ = 
    `SELECT t.*
    FROM TaskStatus t
    JOIN Milestone m ON t.id = m.status_id
    WHERE m.id = $1;`

    // #endregion

    let list: any[] = [];
    try {
        list = await queryPostgres(q);
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't query for all milestones", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    } 

    if (list.length === 0) {
        formatMessageToServer(loggerName, "couldn't query for all milestones");
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    };

    let milestoneList: Milestone[] = [];
 
    await Promise.all(list.map(async (ms) => {

        const roadmapArray: Roadmap[] = [];
        try {
            if (roadmaps === 'true') {
                const roadmapList: any[] = await queryPostgres(roadmapQ, [ms.id]);
                roadmapList.forEach(roadmap => {
                    roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't execute roadmapQ", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        }
     
        const tagArray: Tag[] = [];
        try {
            if (tags === 'true') {
                const tagsList: any[] = await queryPostgres(tagsQ, [ms.id]);
                tagsList.forEach(tag => {
                    tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't execute tagQ", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        }

        let taskStatus: TaskStatus = new TaskStatus('', '', 0, 0); // placeholder value
        try {
            const status = await queryPostgres(taskStatusQ, [ms.id]);
            if (status.length > 0) {
                const statusObject = status[0];
                taskStatus = new TaskStatus(statusObject.name, statusObject.description, statusObject.id, statusObject.type_id);
            }
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't fetch a task status for a milestone from postgres", err);
            res.status(404).json(formatMessageToClient('Error with query', err));
        }
      
        milestoneList.push(new Milestone(ms.name, ms.description, roadmapArray, tagArray, ms.date, taskStatus,
            ms.id, ms.type_id));
    }));

    res.status(200).send(milestoneList);
});

app.get("/api/milestones/:id", async (req, res) => {
    const { roadmaps, tags } = req.query;
    const id = parseInt(req.params.id);

    const loggerName = 'MILESTONES ID GET';

    if ((roadmaps && !isBooleanStringValidator(roadmaps)) || (tags && !isBooleanStringValidator(tags))) {
        formatMessageToServer(loggerName, "roadmap and or tag are not in corret format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }
    
    if (!isNumValidator(id)) {
        return res.status(400).json({ error: formatMessageToClient('ID for milestones is invalid') });
    }

    // #region Queries 

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

    const taskStatusQ =
        `SELECT t.*
        FROM TaskStatus t
        JOIN Milestone m ON t.id = m.status_id
        WHERE m.id = $1;`

    // #endregion

    let queriedItem: any;
    try {
        queriedItem = await queryPostgres(q);
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't query for this milestone id " + id, err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    } 
    const item = queriedItem[0];

    const roadmapArray: Roadmap[] = [];
    try {
        if (roadmaps === 'true') {
            const roadmapList: any[] = await queryPostgres(roadmapQ, [item.id]);
            roadmapList.forEach(roadmap => {
                roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
            });
        } 
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't execute roadmapQ", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    }
 
    const tagArray: Tag[] = [];
    try {
        if (tags === 'true') {
            const tagsList: any[] = await queryPostgres(tagsQ, [item.id]);
            tagsList.forEach(tag => {
                tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
            });
        } 
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't execute tagQ", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    }

    let taskStatus: TaskStatus = new TaskStatus('', '', 0, 0);
    try {
        const status = await queryPostgres(taskStatusQ, [item.id]);
        const statusObject = status[0];
        taskStatus = new TaskStatus(statusObject.name, statusObject.description, statusObject.id, statusObject.type_id);
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't fetch a task status for a milestone from postgres", err);
        res.status(404).json(formatMessageToClient('Error with query', err));
    }

    const newItem = new Milestone(item.name, item.description, roadmapArray, tagArray,
        item.date, taskStatus, item.id, item.type_id);

    res.send(newItem);
}); 

app.put("/api/milestones/:id", async (req, res) => { 
    const id = parseInt(req.params.id);

    const { name, description, date, taskStatus_id, tags, roadmaps } = req.body;

    const loggerName = 'MILESTONES PUT';

    const putMilestone: Milestone = req.body;

    // #region Validation
    checkNumberInputValidator(id, 'Could not proccess milestone due to its ID', loggerName, res);
    checkStringInputValidator("Name", name, loggerName, res);
    checkStringInputValidator("Description", name, loggerName, res);
    checkDateInputValidator('Date', date, loggerName, res);
    taskStatus_id && checkNumberInputValidator(taskStatus_id, 'Task Status is not valid for ' + name, loggerName, res);
    if (tags) {
        const sentTags = tags as Tag[];
        const tagIds = sentTags.map(tag => tag.id);
        if (!isArrayOfNumbersValidator(tagIds)) {
            formatMessageToServer(loggerName, 'Tag input for milestone ' + name + 'is invalid');
            return res.status(400).json({ error: formatMessageToClient('Could not process the given milestone tags for ' + name) });
        }
    }      
    if (roadmaps) {
        const sentRoadmaps = roadmaps as Roadmap[];
        const roadmapIds = sentRoadmaps.map(map => map.id);
        if (!isArrayOfNumbersValidator(roadmapIds)) {
            formatMessageToServer(loggerName, 'Roadmap input for milestone ' + name + 'is invalid');
            return res.status(400).json({ error: formatMessageToClient('Could not process the given milestone roadmaps for ' + name) });
        }
    }   
    // #endregion
  
    // #region Queries 

    const insertRowIntoMilestoneTagQ = `
    INSERT INTO MilestoneTag (milestone_id, tag_id)
    VALUES ($1, $2)
    `;

    const insertRowIntoRoadmapMilestoneQ = `
    INSERT INTO RoadmapMilestone (roadmap_id, milestone_id)
    VALUES ($1, $2)
    `;

    const updateMilestoneQ = `
    UPDATE Milestone
    SET name = $1,
        description = $2,
        date = $3,
        status_id = $4
    WHERE id = $5
    RETURNING *;
  `;

    const getAllRowsFromMilestoneTagByMilestoneIdQ = `
    SELECT *
    FROM MilestoneTag
	WHERE milestone_id = $1;
    ` ;

    const getAllRowsFromRoadmapMilestoneByMilestoneIdQ = `
    SELECT *
    FROM RoadmapMilestone
	WHERE milestone_id = $1;
    ` ;

    const deleteRowFromMilestoneTagQ = `
    DELETE FROM MilestoneTag WHERE milestone_id = $1 AND tag_id = $2
    `;

    const deleteRowFromRoadmapMilestoneQ = `
    DELETE FROM RoadmapMilestone WHERE roadmap_id = $1 AND milestone_id = $2
    `;

    // #endregion

    let item: any;

    try {
        item = await queryPostgres(updateMilestoneQ, [name, description, date, putMilestone.taskStatus.id, id]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('milestone', loggerName, id, err, res);
    }

    //tags
    let newTagRows: any[] = [];
    let dbTagRows: any[] = [];
    try {
        dbTagRows = await queryPostgres(getAllRowsFromMilestoneTagByMilestoneIdQ, [id]);
        const tagArrayFromParams: Tag[] = Array.isArray(tags) ? tags : JSON.parse(tags);

        tagArrayFromParams.map(tag => {
            newTagRows.push({
                milestone_id: id,
                tag_id: tag.id
            });
        });
    } catch (err) {
        formatQueryAllUnitsErrorMessage('tags for milestone', loggerName, id, err, res);
    }

    const rowsToDelete = dbTagRows.filter(dbRow =>
        !newTagRows.some(newRow => newRow.milestone_id === dbRow.milestone_id && newRow.tag_id === dbRow.tag_id)
    );

    const rowsToInsert = newTagRows.filter(newRow =>
        !dbTagRows.some(dbRow => dbRow.milestone_id === newRow.milestone_id && dbRow.tag_id === newRow.tag_id)
    );

    await Promise.all(rowsToDelete.map(async row => {
        try {
            await queryPostgres(deleteRowFromMilestoneTagQ, [row.milestone_id, row.tag_id]);
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't delete tag rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    await Promise.all(rowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoMilestoneTagQ, [row.milestone_id, row.tag_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add tag rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    //roadmaps
    let dbRoadmapRows: any[] = [];
    let newRoadmapRows: any[] = [];
    try {
        dbRoadmapRows = await queryPostgres(getAllRowsFromRoadmapMilestoneByMilestoneIdQ, [id]);
        let roadmapArrayFromParams: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
        roadmapArrayFromParams = putMilestone.roadmaps.map(map => map.id);
        roadmapArrayFromParams.map(map => {
            newRoadmapRows.push({
                roadmap_id: map,
                milestone_id: id
            });
        });
    } catch (err) {
        formatQueryAllUnitsErrorMessage('roadmaps for milestone', loggerName, id, err, res);
    }

      
    const roadmapRowsToDelete = dbRoadmapRows.filter(dbRow =>
        !newTagRows.some(newRow => newRow.milestone_id === dbRow.milestone_id && newRow.roadmap_id === dbRow.roadmap_id)
    );
    const roadmapRowsToInsert = newRoadmapRows.filter(newRow =>
        !dbTagRows.some(dbRow => dbRow.milestone_id === newRow.milestone_id && dbRow.roadmap_id === newRow.roadmap_id)
    );

    await Promise.all(roadmapRowsToDelete.map(async row => {
        try {
            await queryPostgres(deleteRowFromRoadmapMilestoneQ, [row.roadmap_id, row.milestone_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't delete roadmap rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    await Promise.all(roadmapRowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoRoadmapMilestoneQ, [row.roadmap_id, row.milestone_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add roadmap rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));


    res.status(201).json(putMilestone); 
 
});

app.post("/api/milestones", async (req, res) => {
    const { name, description, date, taskStatus, tags, roadmaps } = req.body;

    const loggerName = 'MILESTONES POST';

    // #region Validation
    checkStringInputValidator('Name', name, loggerName, res);
    checkStringInputValidator('Description', description, loggerName, res)
    checkDateInputValidator('Date', date, loggerName, res);
    checkNumberInputValidator(taskStatus, 'Task Status is not valid', loggerName, res);
    checkArrayOfNumbersInputValidator('tags', tags, loggerName, res);
    checkArrayOfNumbersInputValidator('roadmaps', roadmaps, loggerName, res);
    // #endregion

    // #region Queries 

    const q: string = `
    INSERT INTO Milestone (name, description, date, status_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
`;

    const insertIntoMilestoneTag = `
    INSERT INTO MilestoneTag (milestone_id, tag_id)
    VALUES ($1, $2)
    `

    const insertIntoRoadmapMilestone = `
    INSERT INTO RoadmapMilestone (roadmap_id, milestone_id)
    VALUES ($1, $2)
    `

    // #endregion

    const newItem = await queryPostgres(q, [name, description, date, taskStatus]);
    const tagArray: number[] = Array.isArray(tags) ? tags : JSON.parse(tags);

    //let clientMessage: string = 'Milestone successfully made.\n';
    await Promise.all(tagArray.map(async (tagId) => {
        try {
            await queryPostgres(insertIntoMilestoneTag, [newItem[0].id, tagId]);
        }
        catch (err: any) {
            if (err.code === '23505') { 
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name, err);

               // clientMessage += 'Tag is already attached to milestone \n'
            }
            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name);

               // clientMessage += 'Tags given does not exist but milestone still was made. \n'
            }
        }
    }));

    const roadmapArray: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
    await Promise.all(roadmapArray.map(async (mapId) => {
        try {
            const res = await queryPostgres(insertIntoRoadmapMilestone, [mapId, newItem[0].id,]);
        }
        catch (err: any) {
            if (err.code === '23505') {
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name, err);
               // clientMessage += 'Roadmap is already attached to milestone.\n'
            }

            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name);

               // clientMessage += 'Roadmaps given does not exist but milestone still was made. \n'
            }
        }
    }));

    //remake milestone
    let fullMilestone;
    try {
        const url = '/api/milestones/' + newItem[0].id + '?roadmaps=true&tags=true';
        fullMilestone = await fetchData(url);
    } catch (error) {
        formatQuerySingleUnitErrorMessage('milestone', loggerName, newItem[0].id, error, res);
    }

    res.status(201).json(fullMilestone);

});

app.delete("/api/milestones/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    const loggerName = 'MILESTONES POST';
 
    checkNumberInputValidator(id, 'Assignee ID is not valid', loggerName, res);

    const q = formatDeleteIdfromDatabaseQuery('Milestone', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Milestone not found- does not exist in records'));
        }
    } catch (err) {
        formatQueryDeleteUnitErrorMessage('milestone', loggerName, id, err, res);
    };
}); 

//#endregion

//#region Assignees GOOD
app.get("/api/assignees", async (req, res) => {
    const q: string = formatSelectAllFromTable('Assignee');

    try {
        const list: any[] = await queryPostgres(q);
        if (!list || list.length === 0) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };
        const newList: Assignee[] = [];
        list.map(a => {
            newList.push(new Assignee(
                a.name, a.description, a.id, a.type_id
            ))
        });

        res.status(200).send(newList); 
    } catch (err) {
        console.error('Error fetching assignees:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignees'));
    };
});

app.get("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json(formatMessageToClient('ID for assignee is invalid'));
    }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(newItem);
    } catch (err) {
        console.error('Error fetching assignee:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignee')); 
    };
}); 

app.put("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json(formatMessageToClient('ID for assignee is invalid'));
    }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);

        const updatedItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(updatedItem);
    } catch (err) {
        console.error('Error fetching assignee:', err);
        res.status(500).send(formatMessageToClient('Error fetching assignee'));
    };
});

app.post("/api/assignees", async (req, res) => {
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Name is too long for tag ' + name));
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Description is too long for tag ' + name));
    }

    const q: string = `
        INSERT INTO Assignee (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

         const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);


        if (item.length > 0) { //should move all of these up under item
            res.status(201).json(newItem);
        } else {
            res.status(400).json(formatMessageToClient('Assignee ' + name + ' could not be created'));
        }
    } catch (err) {
        console.error('Error creating assignee: ' + name, err);
        res.status(500).json(formatMessageToClient('Internal Server Error'));
    }
});


app.delete("/api/assignees/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (!isNumValidator(id)) {
        return res.status(400).json(formatMessageToClient('ID for assignee is invalid'));
    }

    const q = formatDeleteIdfromDatabaseQuery('Assignee', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Assignee not found- does not exist in records'));
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
        const tagList: any[] = await queryPostgres(q);
        if (!tagList) {
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        };

        let newList: Tag[] = [];
        tagList.map(tag => {
            newList.push(new Tag(
                tag.name, tag.description, tag.id, tag.type_id
            ))
        });

        res.status(200).send(newList);
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).send(formatMessageToClient('Error fetching tags'));
    };
});

app.put("/api/tags/:id", async (req, res) => { 
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Name is too long for tag ' + name));
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Description is too long for tag ' + name));
    }

    const q: string = `UPDATE Tag SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(updatedItem);
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

        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);
        res.status(200).send(newItem);
    } catch (err) {
        console.error('Error fetching tag:', err);
        res.status(500).send(formatMessageToClient('Error fetching tag'));
    };
}); 

app.post("/api/tags", async (req, res) => { 
    const { name, description } = req.body;

    if (!validator.isLength(name, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Name is too long for tag ' + name));
    }
    if (!validator.isLength(description, { max: 255 })) {
        return res.status(400).json(formatMessageToClient('Description is too long for tag ' + name));
    }

    const q: string = `
        INSERT INTO Tag (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try { 
        const item = await queryPostgres(q, [name, description]);
        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);
        console.log("item[0]", newItem)
        console.log("item length" + item.length)
        if (item.length > 0) {
            res.status(201).json(newItem);
        } else {
            console.log("item length wasn't over zero");
            res.status(400).json(formatMessageToClient('Tag ' + name + ' could not be created'));
        }
    } catch (err) {
        console.error('Error creating tag: ' + name, err);
        res.status(500).json(formatMessageToClient('Internal Server Error'));
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
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Tag not found- does not exist in records'));
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
        res.status(200).send(list);
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
        res.status(200).send(item[0]);
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
        const item = await queryPostgres(q, [name, description]);
        const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        if (item.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json(formatMessageToClient('Task Status ' + name + ' could not be created'));
        }
    } catch (err) {
        console.error('Error creating task status: ' + name, err);
        res.status(500).json(formatMessageToClient('Internal Server Error'));
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
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Task Status not found- does not exist in records'));
        }
    } catch (err) {
        console.error('Error deleting task status:', err);
        res.status(500).send(formatMessageToClient('Internal Server Error'));
    };
}); 

//#endregion

// #region Roadmaps ACTUALLY GOOD
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
                new Roadmap(map.name, map.description, map.id, map.type_id));
        });

        res.status(200).send(roadmapList); 
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
        res.status(200).send(item[0]);
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
    console.log("roadmap post")
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
        const item = await queryPostgres(q, [name, description]);
        const newItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        if (item.length > 0) {
            res.status(201).json(newItem);
        } else {
            res.status(400).json(formatMessageToClient('Roadmap ' + name + ' could not be created'));
        }
    } catch (err) {
        console.error('Error creating roadmap: ' + name, err);
        res.status(500).json(formatMessageToClient('Internal Server Error'));
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
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Roadmap not found- does not exist in records'));
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
        res.status(200).send(unitTypesList); //remove message and fix frontend
    } catch (err) {
        console.error('Error fetching unit types:', err);
        res.status(500).send(formatMessageToClient('Error fetching unit types'));
    };
});

app.get("/api/unittypes/:id", async (req, res) => { 
    const typeId = parseInt(req.params.id);

    if (!isNumValidator(typeId)) {
        return res.status(400).json(formatMessageToClient('ID for unittype is invalid'));
    }

    const q: string = formatSelectIdfromDatabaseQuery('UnitType', typeId); 

    try { 
        const item = await queryPostgres(q);
        console.log("get id ", item)
        res.status(200).send(item[0]); 
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

//FOR ID, maybe use a prefix as an identifier? 