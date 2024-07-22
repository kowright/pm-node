import express, { Request, Response, Express, NextFunction } from 'express';


//for distinguishing logs from backend on the frontend
export function formatMessageToClient(text: string): string;
export function formatMessageToClient(text: string, err: any): string;
export function formatMessageToClient(text: string, err?: any): string {
    if (err !== undefined) {
        return `[SERVER] ${text} | ${err}`;
    } else {
        return `[SERVER] ${text}`;
    }
}

//for stack trace
export function formatMessageToServer(loggerName: string, text: string): void;
export function formatMessageToServer(loggerName: string, text: string, err: any): void;
export function formatMessageToServer(loggerName: string, text: string, err?: any): void {
    if (err !== undefined) {
        console.log(`[${loggerName}]: ${text} | ${err}`);
    } else {
        console.log(`[${loggerName}]: ${text}`);
    }
}


export function formatQuerySingleUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for " + singleUnitName + " id " + id, err);
    res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
}

export function formatQuerySingleUnitErrorMessage1(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for " + singleUnitName + " id " + id, err);

    return {
        statusCode: 400,
        message: formatMessageToClient('Error with query; no results returned', err),
    };
}

export function formatQueryAllUnitsErrorMessage(pluralUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for all " + pluralUnitName, err);
    res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
}

export function formatQueryDeleteUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {

    if (err.code === '23503') { //the unit being deleted is still in use by a table
        const tableName = err.table;

        formatMessageToServer(loggerName, "couldn't insert into table for " + singleUnitName, err);

        const errorMessage = formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records')
        //res.status(404).json(formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records', err));



        return res.status(404).json({
            error: errorMessage,
            table: tableName
        });
    }

    formatMessageToServer(loggerName, "couldn't find ID " + id + " for " + singleUnitName, err);
    res.status(404).json(formatMessageToClient(singleUnitName + ' not found- does not exist in records', err));
}

export function formatQueryDeleteUnitErrorMessage1(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    if (err.code === '23503') { // The unit being deleted is still in use by a table
        const tableName = err.table;
        formatMessageToServer(loggerName, "Couldn't delete " + singleUnitName + " because it is in use", err);

        const errorMessage = formatMessageToClient(singleUnitName + ' could not be deleted - still in use');
        const statusCode = 404;

        return {
            errorMessage: formatMessageToClient(singleUnitName + ' could not be deleted - still in use'),
            table: tableName,
            statusCode: 404,
        };
    }

    formatMessageToServer(loggerName, "Couldn't find ID " + id + " for " + singleUnitName, err);
    const errorMessage = formatMessageToClient(singleUnitName + ' not found');
    const statusCode = 404;

    return {
        errorMessage: formatMessageToClient(singleUnitName + ' not found'),
        statusCode: 404,

    };
}


export function formatQueryPostUnitErrorMessage(singleUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't insert into table for " + singleUnitName, err);
    res.status(404).json(formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records', err));
}
export function formatQueryPostUnitErrorMessage1(singleUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't insert into table for " + singleUnitName, err);
    return {
        statusCode: 404,
        message: formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records'),
    };
}

export function formatQueryAllUnitsErrorMessage1(pluralUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for all " + pluralUnitName, err);
    return {
        statusCode: 400,
        message: formatMessageToClient('Error with query; no results returned', err),
    };
}
