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

export function formatQueryAllUnitsErrorMessage(pluralUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't query for all " + pluralUnitName, err);
    res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
}

export function formatQueryDeleteUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't find ID " + id + " for " + singleUnitName, err);
    res.status(404).json(formatMessageToClient(singleUnitName + ' not found- does not exist in records', err));
}

export function formatQueryPostUnitErrorMessage(singleUnitName: string, loggerName: string, err: any, res: Response) {
    formatMessageToServer(loggerName, "couldn't insert into table for " + singleUnitName, err);
    res.status(404).json(formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records', err));
}
