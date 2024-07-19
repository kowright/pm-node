import { Request, Response } from 'express';
import { formatMessageToClient, formatMessageToServer, formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { isBooleanStringValidator, validateArrayOfNumbersInput, validateDateInput, validateNumberInput, validateStringInput } from '../utils/validators';
import { queryPostgres } from '../database/postgres';
import { Task } from '../models/Task';
import Roadmap from '../models/Roadmap';
import Tag from '../models/Tag';
import Assignee from '../models/Assignee';
import TaskStatus from '../models/TaskStatus';
import { formatDeleteIdfromDatabaseQuery } from '../database/queries';

const loggerUnit = 'TASK';
//TODO make POST requests call GET API


export const getTasks = async (req: Request, res: Response) => {

    const { roadmaps, tags } = req.query;

    const loggerName = loggerUnit + ' GET';

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
}

export const getTaskId = async (req: Request, res: Response) => {
    const { roadmaps, tags } = req.query;

    const id = parseInt(req.params.id);

    const loggerName = loggerUnit + ' ID GET';

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
}

export const createTask = async (req: Request, res: Response) => {
    const { name, description, startDate, endDate, assignee, taskStatus, tags, roadmaps } = req.body;

    const loggerName = loggerUnit + ' POST';

    // #region Validation

    validateStringInput('Name', name, loggerName, res);
    validateStringInput('Description', description, loggerName, res)
    validateDateInput('Date', startDate, loggerName, res);
    validateDateInput('Date', endDate, loggerName, res);
    validateNumberInput(taskStatus, 'Task Status is not valid', loggerName, res);
    validateArrayOfNumbersInput('tags', tags, loggerName, res);
    validateArrayOfNumbersInput('roadmaps', roadmaps, loggerName, res);
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
        formatQueryPostUnitErrorMessage('task', loggerName, err, res);
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
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name.err);
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
        formatQueryAllUnitsErrorMessage('roadmaps for task', loggerName, err, res);
    }

    const tagGetArray: Tag[] = [];
    try {
        const tagsList: any[] = await queryPostgres(tagsQ, [t.id]);
        tagsList.forEach(tag => {
            tagGetArray.push(new Tag(tag.name, tag.description, tag.id, tag.type_id));
        });
    } catch (err) {
        formatQueryAllUnitsErrorMessage('tags for task', loggerName, err, res);
    }

    let fullTaskObj: any;
    try {
        fullTaskObj = await queryPostgres(getEverything, [t.id]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('task', loggerName, t.id, err, res);
    }

    const fullTask = fullTaskObj[0];

    const as = new Assignee(fullTask.assignee_name, fullTask.assignee_description, fullTask.assignee_id, fullTask.assignee_type_id);
    const ts = new TaskStatus(fullTask.task_status_name, fullTask.task_status_description, fullTask.task_status_id, fullTask.task_status_type_id);

    const task = new Task(fullTask.task_name, fullTask.task_description, roadmapGetArray, tagGetArray,
        as, fullTask.start_date, fullTask.end_date, ts, fullTask.task_id, fullTask.type_id);

    res.status(201).json(task);
}

export const updateTaskId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = loggerUnit + ' PUT';

    const { name, description, assignee, startDate, endDate, tags, roadmaps } = req.body;
    const putTask: Task = req.body;

    // #region Validation

    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);
    validateDateInput('start date', startDate, loggerName, res);
    validateDateInput('end date', startDate, loggerName, res);
    validateNumberInput(putTask.taskStatus.id, 'task status is not valid', loggerName, res);
    if (tags) {
        const sentTags = tags as Tag[];
        const tagIds = sentTags.map(tag => tag.id);

        validateArrayOfNumbersInput('tag ids', tagIds, loggerName, res);

    
    }
    if (roadmaps) {
        const sentRoadmaps = roadmaps as Roadmap[];
        const roadmapIds = sentRoadmaps.map(map => map.id);


        validateArrayOfNumbersInput('roadmap ids', roadmapIds, loggerName, res);
    }
 
    validateNumberInput(id, 'ID for task is invalid', loggerName, res);

    validateNumberInput(assignee, 'ID for assignee is invalid', loggerName, res);


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

    let item: any;
    try {
        item = await queryPostgres(updateTaskQ, [name, description, startDate, endDate, assignee.id, putTask.taskStatus.id, id]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('task', loggerName, id, err, res);
    }

    //tags
    let dbTagRows: any[] = [];

    try {
        dbTagRows = await queryPostgres(getAllRowsFromTaskTagByTaskIdQ, [id]);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('tags for task', loggerName, err, res);
    }
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
        try {
            await queryPostgres(deleteRowFromTaskTagQ, [row.task_id, row.tag_id]);
        } catch (err) {
            formatQueryDeleteUnitErrorMessage('tags for task', loggerName, id, err, res);
        }
    }));

    await Promise.all(rowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoTaskTagQ, [row.task_id, row.tag_id]);
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add tag rows for task" + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    //roadmaps
    let dbRoadmapRows: any[] = [];

    try {
        dbRoadmapRows = await queryPostgres(getAllRowsFromTaskRoadmapByTaskIdQ, [id]);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('roadmaps for task', loggerName, err, res);
    }
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
        try {
            await queryPostgres(deleteRowFromTaskRoadmapQ, [row.task_id, row.roadmap_id]);
        } catch (err) {
            formatQueryDeleteUnitErrorMessage('roadmaps for task', loggerName, id, err, res);
        }
    }));

    await Promise.all(roadmapRowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoTaskRoadmapQ, [row.task_id, row.roadmap_id,]);
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add roadmap rows for tasks " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    res.status(201).json(putTask);
}

export const deleteTaskId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = loggerUnit + ' DELETE';

    validateNumberInput(id, 'ID for task is invalid', loggerName, res);

    const q = formatDeleteIdfromDatabaseQuery('Task', id);

    try {
        await queryPostgres(q);
        res.status(200).json('deleted');
    } catch (err) {
        formatQueryDeleteUnitErrorMessage('task', loggerName, id, err, res);
    };
}