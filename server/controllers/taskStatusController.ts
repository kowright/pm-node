import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput } from '../utils/validators';
import TaskStatus from '../models/TaskStatus';
const loggerName = 'TASK STATUS';

export const getTaskStatuses = async (req: Request, res: Response) => {
    const q: string = formatSelectAllFromTable('TaskStatus');

    const loggerName = 'TASK STATUS GET';

    //TODO switch to creating task statuses with new TaskStatus
    try {
        const list = await queryPostgres(q);

        res.status(200).send(list);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('task status', loggerName, err, res);
    };
}

export const getTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TASK STATUS ID GET';

    if (!validateNumberInput('id', id, 'ID for task is invalid', loggerName, res)) { return; };


    const q: string = formatSelectIdfromDatabaseQuery('TaskStatus', id);

    try {
        const item = await queryPostgres(q); //TODO change to create a task status 

        res.status(200).send(item[0]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('task status', loggerName, id, err, res);
    };
}

export const createTaskStatus = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'TASK STATUS POST';

    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);

    const q: string = `
        INSERT INTO TaskStatus (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        res.status(201).json(newItem);

    } catch (err) {
        formatQueryPostUnitErrorMessage('assignee', loggerName, err, res);
    }
}

export const updateTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'TASK STATUS PUT';

    // #region Validation
    if (!validateNumberInput('id', id, 'ID for task is invalid', loggerName, res)) { return; };
    if (!validateStringInput('Name', name, loggerName, res)) { return; }
    if (!validateStringInput('Description', description, loggerName, res)) { return; }
    // #endregion

    const q: string = `UPDATE TaskStatus SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]); //TODO create a task status with new TaskStatus
        //const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        res.status(200).send(item[0]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('task status', loggerName, id, err, res);
    };
}

export const deleteTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TASK STATUS DELETE';

    if (!validateNumberInput('id', id, 'ID for task is invalid', loggerName, res)) { return; };

    const q = formatDeleteIdfromDatabaseQuery('TaskStatus', id);

    try {
        await queryPostgres(q);

        res.status(200).json('deleted');

    } catch (err) {
        formatQueryDeleteUnitErrorMessage('assignee', loggerName, id, err, res);
    };
}