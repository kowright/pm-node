import { Request, Response } from 'express';
import { formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { queryPostgres } from '../database/postgres';
import { formatQueryAllUnitsErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { validateNumberInput, validateStringInput } from '../utils/validators';

const loggerName = 'UNIT TYPE';

export const getUnitTypes = async (req: Request, res: Response) => {
    const loggerName = 'UNIT TYPES GET';

    const q: string = formatSelectAllFromTable('UnitType');

    try {
        const unitTypesList = await queryPostgres(q);

        res.status(200).send(unitTypesList);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('unit types', loggerName, err, res);
    };
}

export const getUnitTypesId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'UNIT TYPES GET';

    validateNumberInput(id, 'ID for tag is invalid', loggerName, res);

    const q: string = formatSelectIdfromDatabaseQuery('UnitType', id);

    try {
        const item = await queryPostgres(q);

        res.status(200).send(item[0]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('unit types', 'could not find unit type', id, err, res);
    };
}

export const updateUnitTypesId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name } = req.body;

    const loggerName = 'UNIT TYPES GET';

    validateStringInput('name', name, loggerName, res);

    const q: string = `UPDATE UnitType SET name = '${name}' WHERE id = ${id} RETURNING *`;

    try {
        const item = await queryPostgres(q);

        res.status(200).send(item[0]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('unit type', 'could not update unit type', id, err, res);
    };
}
