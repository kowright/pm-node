import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput } from '../utils/validators';
import Tag from '../models/Tag';

const loggerName = 'TAG';

export const getTags = async (req: Request, res: Response) => {
    const loggerName = 'TAGS GET';

    const q: string = formatSelectAllFromTable('Tag');

    let tagList: any[] = [];
    try {
        tagList = await queryPostgres(q);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('tag', loggerName, err, res);
    };

    let newList: Tag[] = [];
    tagList.map(tag => {
        newList.push(new Tag(
            tag.name, tag.description, tag.id, tag.type_id
        ))
    });

    res.status(200).send(newList);
}

export const getTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q: string = formatSelectIdfromDatabaseQuery('Tag', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(newItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('tag', 'could not find tag', id, err, res);
    };
}

export const createTag = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'TAGS PUT';

    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);

    const q: string = `
        INSERT INTO Tag (name, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    try {
        const item = await queryPostgres(q, [name, description]);

        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(201).json(newItem);

    } catch (err) {
        formatQueryPostUnitErrorMessage('tag', loggerName, err, res);
    }
}

export const updateTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'TAGS PUT';

    validateStringInput('name', name, loggerName, res);
    validateStringInput('description', description, loggerName, res);

    const q: string = `UPDATE Tag SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        res.status(200).send(updatedItem);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('tag', 'could not update tag', id, err, res);
    };
}

export const deleteTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q = formatDeleteIdfromDatabaseQuery('Tag', id);

    try {
        await queryPostgres(q);

        res.status(200).json('deleted');

    } catch (err) {
        formatQueryDeleteUnitErrorMessage('tag', loggerName, id, err, res);
    };
}