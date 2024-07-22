import { Request, Response } from 'express';
import { formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { queryPostgres } from '../database/postgres';
import { formatQueryAllUnitsErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { validateNumberInput, validateStringInput, validationPassStatusCode } from '../utils/validators';

const loggerName = 'UNIT TYPE';

export const getUnitTypes = async (req: Request, res: Response) => {
    const loggerName = 'UNIT TYPES GET';

    const q: string = formatSelectAllFromTable('UnitType');

    try {
        const unitTypesList = await queryPostgres(q);

        return res.status(200).send(unitTypesList);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('unit types', loggerName, err);
        return res.status(statusCode).send(message);
    };
}

export const getUnitTypesId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'UNIT TYPES GET';

    const numValidation = validateNumberInput('id', id, 'id is not valid', loggerName);
    if (numValidation.statusCode !== validationPassStatusCode) {
        return res.status(numValidation.statusCode).json({ error: numValidation.message });
    }

    const q: string = formatSelectIdfromDatabaseQuery('UnitType', id);

    try {
        const item = await queryPostgres(q);

        return res.status(200).send(item[0]);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('unit type', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}

export const updateUnitTypesId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name } = req.body;

    const loggerName = 'UNIT TYPES GET';

    const nameValidation = validateStringInput('Name', name, loggerName);
    if (nameValidation.statusCode !== validationPassStatusCode) {
        return res.status(nameValidation.statusCode).json({ error: nameValidation.message });
    }

    const q: string = `UPDATE UnitType SET name = '${name}' WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q);

        return res.status(200).send(item[0]);
    } catch (err) {
        const { statusCode, message } = formatQuerySingleUnitErrorMessage('assignee', loggerName, id, err);
        return res.status(statusCode).send(message);
    };
}
