import {formatMessageToServer, formatMessageToClient} from './logger';
import express, { Request, Response, Express, NextFunction } from 'express';

const dayjs = require('dayjs');
const validator = require('validator'); 

const isNumValidator = (id: number) => {
    if (isNaN(id) || id <= 0) {
        return false;
    }
    return true;
};

export const isBooleanStringValidator = (i: any) => {
    return i === 'true' || i === 'false'
};

function isArrayOfNumbersValidator(tags: any): boolean {
    if (!Array.isArray(tags)) {
        return false; // Not an array
    }

    for (let i = 0; i < tags.length; i++) {
        if (typeof tags[i] !== 'number' || isNaN(tags[i])) {
            return false; // Element is not a number or NaN
        }
    }

    return true; 
}

export function validateStringInput(stringType: string, name: string, loggerName: string, res: Response) { //TODO name should be any
    if (!validator.isLength(name, { max: 255 })) {
        formatMessageToServer(loggerName, stringType + " is too long for " + name);
        return res.status(400).json({ error: formatMessageToClient('Name is too long for task ' + name) });
    }
}

export function validateDateInput(dateTitle: string, dateValue: string, loggerName: string, res: Response) {
    if (!dayjs(dateValue, 'YYYY-MM-DD', true).isValid()) {
        formatMessageToServer(loggerName, dateTitle + ' format is not correct: ' + dateValue);
        return res.status(400).json({ error: formatMessageToClient(dateTitle + ' format is not correct: ' + dateValue) });
    }
}

export function validateNumberInput(num: any, clientMessage: string, loggerName: string, res: Response) {
    if (!isNumValidator(num)) {
        formatMessageToServer(loggerName, num + ' is not a number');
        return res.status(400).json({ error: formatMessageToClient(clientMessage) });
    }
}

export function validateArrayOfNumbersInput(arrayName: string, array: any[], loggerName: string, res: Response) {
    if (!isArrayOfNumbersValidator(array)) {
        formatMessageToServer(loggerName, arrayName + ' is not an array of numbers')
        return res.status(400).json({ error: formatMessageToClient('Params for milestone ' + arrayName + 'is invalid') });
    }
}

