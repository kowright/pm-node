import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput } from '../utils/validators';

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
        formatQueryAllUnitsErrorMessage('assignes', loggerName, err, res);
    }

    const newList: Assignee[] = [];
    list.map(a => {
        newList.push(new Assignee(a.name, a.description, a.id, a.type_id))
    });

    res.status(200).send(newList);
}

export const getAssigneeId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ASSIGNEES ID GET';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q: string = formatSelectIdfromDatabaseQuery('Assignee', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(newItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('assignee', loggerName, id, err, res);
    };
}

export const createAssignee = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'ASSIGNEES POST';

    if (!validateStringInput('Name', name, loggerName, res)) { return; }
    if (!validateStringInput('Description', description, loggerName, res)) { return; }

    const q: string = `
        INSERT INTO Assignee (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(201).json(newItem);

    } catch (err) {
        formatQueryPostUnitErrorMessage('assignee', loggerName, err, res);
    }
}

export const updateAssigneeId = async (req: Request, res: Response) => { 
    const id = parseInt(req.params.id);

    const { name, description } = req.body; //TODO check if can do this in frontend

    const loggerName = 'ASSIGNEES PUT';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }
    if (!validateStringInput('Name', name, loggerName, res)) { return; }
    if (!validateStringInput('Description', description, loggerName, res)) { return; }

    //const q: string = formatSelectIdfromDatabaseQuery('Assignee', id); //change to an update query like below
    const q: string = `UPDATE Assignee SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Assignee(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(updatedItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('assignee', loggerName, id, err, res);
    };
}

export const deleteAssigneeId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ASSIGNEES DELETE';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q = formatDeleteIdfromDatabaseQuery('Assignee', id);

    try {
        await queryPostgres(q);

        res.status(200).json('deleted');
    } catch (err) {
        formatQueryDeleteUnitErrorMessage('assignee', loggerName, id, err, res);
    };
}