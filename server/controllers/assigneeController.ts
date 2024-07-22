import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput, validationPassStatusCode } from '../utils/validators';

import Assignee from '../models/Assignee';

const loggerName = 'ASSIGNEE';

//TODO make PUT request fix

export const getAssignees = async (req: Request, res: Response) => {
    const loggerName = 'ASSIGNEES GET';

    const q: string = formatSelectAllFromTable('Assignee');

    let list: any[] = [];

    try {
        list = await queryPostgres(q);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('tags', loggerName, err);
        return res.status(statusCode).send(message);
    }

    const newList: Assignee[] = [];
    list.map(a => {
        newList.push(new Assignee(a.name, a.description, a.id, a.type_id))
    });

    return res.status(200).send(newList);
}

export const getAssigneeId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ASSIGNEES ID GET';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(newItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('assignee', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const createAssignee = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'ASSIGNEES POST';

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

    const q: string = `
        INSERT INTO Assignee (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(201).json(newItem);

    } catch (err) {
        const { statusCode, message } = formatQueryPostUnitErrorMessage('assignee', loggerName, err);
        return res.status(statusCode).send(message);
    }
}

export const updateAssigneeId = async (req: Request, res: Response) => { 
    const id = parseInt(req.params.id);

    const { name, description } = req.body; //TODO check if can do this in frontend

    const loggerName = 'ASSIGNEES PUT';

    // #region Validation
    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

    // #endregion

    //const q: string = formatSelectIdfromDatabaseQuery('Assignee', id); //change to an update query like below
    const q: string = `UPDATE Assignee SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(updatedItem);
    } catch (err) { 
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('assignee', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const deleteAssigneeId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ASSIGNEES DELETE';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q = formatDeleteIdfromDatabaseQuery('Assignee', id);

    try {
        await queryPostgres(q);

        return res.status(200).json('deleted');
    } catch (err) {
        const { statusCode, errorMessage, table } = formatQueryDeleteUnitErrorMessage('assignee', loggerName, id, err);
        return res.status(statusCode).send({ error: errorMessage, table: table } );
    };
}