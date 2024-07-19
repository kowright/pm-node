import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput } from '../utils/validators';
import Roadmap from '../models/Roadmap';

const loggerName = 'ROADMAPS';

export const getRoadmaps = async (req: Request, res: Response) => {
    const loggerName = 'ROADMAPS GET';

    const q: string = formatSelectAllFromTable('Roadmap');

    let list: any[] = [];
    try {
        list = await queryPostgres(q);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('roadmaps', loggerName, err, res);
    };

    let roadmapList: Roadmap[] = [];

    list.map(map => {
        roadmapList.push(
            new Roadmap(map.name, map.description, map.id, map.type_id));
    });

    res.status(200).send(roadmapList);
}

export const getRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ROADMAPS ID GET';

    validateNumberInput(id, 'ID for roadmap is invalid', loggerName, res);

    const q: string = formatSelectIdfromDatabaseQuery('Roadmap', id);

    try {
        const item = await queryPostgres(q);

        const getItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(getItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('tag', 'could not find tag', id, err, res);
    };
}

export const createRoadmap = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'ROADMAPS POST';

    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);

    const q: string = `
        INSERT INTO Roadmap (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(201).json(newItem);

    } catch (err) {
        formatQueryPostUnitErrorMessage('tag', loggerName, err, res);
    }
}

export const updateRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'ROADMAPS PUT';

    validateNumberInput(id, 'ID for roadmap is invalid', loggerName, res);
    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);

    const q: string = `UPDATE Roadmap SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Roadmap(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(newItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('tag', 'could not update tag', id, err, res);
    };
}

export const deleteRoadmapId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'ROADMAPS DELETE';

    validateNumberInput(id, 'ID for tag is invalid', loggerName, res);

    const q = formatDeleteIdfromDatabaseQuery('Roadmap', id);

    try {
        await queryPostgres(q);

        res.status(200).json('deleted');

    } catch (err) {
        formatQueryDeleteUnitErrorMessage('roadmap', loggerName, id, err, res);
    };
}