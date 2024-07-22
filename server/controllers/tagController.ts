import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage, formatQueryAllUnitsErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateNumberInput, validateStringInput, validationPassStatusCode } from '../utils/validators';
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
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('tag', loggerName, err);
        return res.status(statusCode).send(message);
    };

}

export const getTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q: string = formatSelectIdfromDatabaseQuery('Tag', id);

    try {
        const item = await queryPostgres(q);

        const newItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(newItem);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('tags', loggerName, err);
        return res.status(statusCode).send(message);
    };
}

export const createTag = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const loggerName = 'TAGS PUT';

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const descriptionValidationResult = validateStringInput('Description', description, loggerName);
    if (descriptionValidationResult.statusCode !== validationPassStatusCode) {
        return res.status(descriptionValidationResult.statusCode).json({ error: descriptionValidationResult.message });
    }

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
        const { statusCode, message } = formatQueryPostUnitErrorMessage('tag', loggerName, err);
        return res.status(statusCode).send(message);
    }
}

export const updateTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description } = req.body;

    const loggerName = 'TAGS PUT';

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

    const q: string = `UPDATE Tag SET name = $1, description = $2 WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q, [name, description]);

        const updatedItem = new Tag(item[0].name, item[0].description, item[0].id, item[0].type_id);

        return res.status(200).send(updatedItem);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('tag', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const deleteTagId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'TAGS PUT';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q = formatDeleteIdfromDatabaseQuery('Tag', id);

    try {
        await queryPostgres(q);

        return res.status(200).json('deleted');

    } catch (err) {
        const { statusCode, errorMessage, table } = formatQueryDeleteUnitErrorMessage('tag', loggerName, id, err);
        return res.status(statusCode).send({ error: errorMessage, table: table });
    };
}