import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryAllUnitsErrorMessage1, formatQueryPostUnitErrorMessage1, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage, formatQuerySingleUnitErrorMessage1, formatQueryDeleteUnitErrorMessage1 } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput, validateNumberInput1, validateStringInput1 } from '../utils/validators';
import Tag from '../models/Tag';

const loggerName = 'TAG';

export const getTags = async (req: Request, res: Response) => {
    const loggerName = 'TAGS GET';

    const q: string = formatSelectAllFromTable('Tag');

    let tagList: any[] = [];
    try {
        tagList = await queryPostgres(q);
  
    let newList: Tag[] = [];
    tagList.map(tag => {
        newList.push(new Tag(
            tag.name, tag.description, tag.id, tag.type_id
        ))
    });

        return res.status(200).send(newList);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage1('tag', loggerName, err, res);
        return res.status(statusCode).send(message);
    };

}

export const getTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q: string = formatSelectIdfromDatabaseQuery('Tag', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(newItem);
    } catch (err) {
        return formatQuerySingleUnitErrorMessage('tag', 'could not find tag', id, err, res);
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

        return res.status(201).json(newItem);

    } catch (err) {

        const { statusCode, message } = formatQueryPostUnitErrorMessage1('tag', loggerName, err, res);
        return res.status(statusCode).send(message);
    }
}

export const updateTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'TAGS PUT';

    const nameValidation = validateStringInput1('Name', name, loggerName, res);
    if (nameValidation.statusCode !== 200) {
        console.log("name validate")
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput1('Description', description, loggerName, res);
    if (descriptionValidationResult.statusCode !== 200) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

    const numValidation = validateNumberInput1('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== 200) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }
    const q: string = `UPDATE Tag SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(updatedItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage1('tag', 'could not update tag', id, err, res);
        return res.status(statusCode).send(message);
    };
}

export const deleteTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    if (!validateNumberInput('id', id, 'id is not valid', loggerName, res)) { return; }

    const q = formatDeleteIdfromDatabaseQuery('Tag', id);

    try {
        await queryPostgres(q);

        return res.status(200).json('deleted');

    } catch (err) {
        const { statusCode, errorMessage } = formatQueryDeleteUnitErrorMessage1('tag', loggerName, id, err, res);
        return res.status(statusCode).send(errorMessage);

    };
}