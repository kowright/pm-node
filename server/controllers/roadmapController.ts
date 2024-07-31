import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput, validationPassStatusCode } from '../utils/validators';
import Roadmap from '../models/Roadmap';

const loggerName = 'ROADMAPS';

export const getRoadmaps = async (req: Request, res: Response) => {
    const loggerName = 'ROADMAPS GET';

    const q: string = formatSelectAllFromTable('Roadmap');

    let list: any[] = [];
    try {
        list = await queryPostgres(q);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('roadmaps', loggerName, err);
        return res.status(statusCode).send(message);
    };

    let roadmapList: Roadmap[] = [];

    list.map(map => {
        roadmapList.push(
            new Roadmap(map.name, map.description, map.id, map.type_id));
    });

    return res.status(200).send(roadmapList);
}

export const getRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ROADMAPS ID GET';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Roadmap', id);

    try {
        const item = await queryPostgres(q);

        const getItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(getItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('roadmap', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const createRoadmap = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'ROADMAPS POST';

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName, false);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

    const q: string = `
        INSERT INTO Roadmap (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(201).json(newItem);

    } catch (err) {
        const { statusCode, message } = formatQueryPostUnitErrorMessage('roadmap', loggerName, err);
        return res.status(statusCode).send(message);
    }
}

export const updateRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'ROADMAPS PUT';

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

    const q: string = `UPDATE Roadmap SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(newItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('roadmap', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const deleteRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ROADMAPS DELETE';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q = formatDeleteIdfromDatabaseQuery('Roadmap', id);

    try {
        await queryPostgres(q);

        return res.status(200).json('deleted');

    } catch (err) {
        const { statusCode, errorMessage, table } = formatQueryDeleteUnitErrorMessage('roadmap', loggerName, id, err);
        return res.status(statusCode).send({ error: errorMessage, table: table });
    };
}