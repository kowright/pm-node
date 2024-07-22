import {formatMessageToServer, formatMessageToClient} from './logger';
import express, { Request, Response, Express, NextFunction } from 'express';

const dayjs = require('dayjs');
const validator = require('validator'); 

export const validationPassStatusCode = 200; 

const isNumValidator = (id: number) => {
    if (isNaN(id) || id < 0) {
        return false;
    }
    return true;
};

export const isBooleanStringValidator = (i: any) => {
    return i === 'true' || i === 'false'
};

function isArrayOfNumbersValidator(tags: any): boolean {
    if (!Array.isArray(tags)) {
        return false; 
    }

    for (let i = 0; i < tags.length; i++) {
        if (typeof tags[i] !== 'number' || isNaN(tags[i])) {
            return false; 
        }
    }

    return true; 
}

export function validateStringInput(stringType: string, name: string, loggerName: string) {
    if (!name || !validator.isLength(name.trim(), { min: 1 } || name.length === 0)) {
        const errorMessage = `${stringType} cannot be empty`;
        formatMessageToServer(loggerName, errorMessage);
        return {
            statusCode: 400,
            message: formatMessageToClient(errorMessage),
        };
    }

    if (!validator.isLength(name, { max: 255 })) {
        const errorMessage = `${stringType} is too long for ${name}`;
        formatMessageToServer(loggerName, errorMessage);
        return {
            statusCode: 400,
            message: formatMessageToClient(errorMessage),
        };
    }

    return {
        statusCode: 200,
        message: 'Validation passed',
    };
}

export function validateDateInput(dateTitle: string, dateValue: string, loggerName: string) {
    if (!dayjs(dateValue, 'YYYY-MM-DD', true).isValid()) {

        /*formatMessageToServer(loggerName, dateTitle + ' format is not correct: ' + dateValue);
        res.status(400).json({ error: formatMessageToClient(dateTitle + ' format is not correct: ' + dateValue) });
        return false;*/
        const message = dateTitle + ' format is not correct: ' + dateValue;
        formatMessageToServer(loggerName, message);
        return {
            statusCode: 400,
            message: formatMessageToClient(message),
        };
    }
    return {
        statusCode: 200,
        message: 'Validation passed',
    };
}

export function validateNumberInput(descriptor: string, num: any, clientMessage: string, loggerName: string) {
    if (!isNumValidator(num)) {
        formatMessageToServer(loggerName, num + ' is not a number for ' + descriptor);
        return {
            statusCode: 400,
            message: formatMessageToClient(clientMessage),
        };
    }
    return { statusCode: 200, message: 'Valid number' }; 
}

export function validateArrayOfNumbersInput(descriptor: string, array:any[], loggerName: string) {
    if (!isArrayOfNumbersValidator(array)) {
        formatMessageToServer(loggerName, descriptor + ' is not an array of numbers');
        return {
            statusCode: 400,
            message: formatMessageToClient(descriptor + ' is not an array of numbers'),
        };
    }
    return { statusCode: 200, message: 'Valid array of numbers' };
}
