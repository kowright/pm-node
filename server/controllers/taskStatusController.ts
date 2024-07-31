import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput, validationPassStatusCode } from '../utils/validators';
import TaskStatus from '../models/TaskStatus';
const loggerName = 'TASK STATUS';

export const getTaskStatuses = async (req: Request, res: Response) => {
    const q: string = formatSelectAllFromTable('TaskStatus');

    const loggerName = 'TASK STATUS GET';

    //TODO switch to creating task statuses with new TaskStatus
    try {
        const list: any[] = await queryPostgres(q);

        let newList: TaskStatus[] = [];
        list.map(ts => {
            newList.push(new TaskStatus(
                ts.name, ts.description, ts.id, ts.type_id
            ))
        });
        return res.status(200).send(newList);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('task statuses', loggerName, err);
        return res.status(statusCode).send(message);    };
}

export const getTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TASK STATUS ID GET';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q: string = formatSelectIdfromDatabaseQuery('TaskStatus', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        return res.status(200).send(newItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('task status', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const createTaskStatus = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'TASK STATUS POST';

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName, false);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

    const q: string = `
        INSERT INTO TaskStatus (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        return res.status(201).json(newItem);

    } catch (err) {
        const { statusCode, message } = formatQueryPostUnitErrorMessage('task status', loggerName, err);
        return res.status(statusCode).send(message);
    }
}

export const updateTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'TASK STATUS PUT';

    // #region Validation
    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName, false);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }
    // #endregion

    const q: string = `UPDATE TaskStatus SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new TaskStatus(item[0].name, item[0].description, item[0].id, item[0].type_id)

        return res.status(200).send(newItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('task status', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const deleteTaskStatusId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TASK STATUS DELETE';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }
    const q = formatDeleteIdfromDatabaseQuery('TaskStatus', id);

    try {
        await queryPostgres(q);

        return res.status(200).json('deleted');

    } catch (err) {
        const { statusCode, errorMessage, table } = formatQueryDeleteUnitErrorMessage('task status', loggerName, id, err);
        return res.status(statusCode).send({ error: errorMessage, table: table });    };
}