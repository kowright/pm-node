
//for distinguishing logs from backend on the frontend
/*export function formatMessageToClient(text: string): string;
export function formatMessageToClient(text: string, err: any): string;*/
export function formatMessageToClient(text: string, err?: any): { error: string } {
    // Construct the error message
    const errorMessage = err !== undefined
        ? `[SERVER] ${text} | ${err}`
        : `[SERVER] ${text}`;

    return { error: errorMessage };
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

//combos
export function formatQuerySingleUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any) {
    formatMessageToServer(loggerName, "couldn't query for " + singleUnitName + " id " + id, err);

    return {
        statusCode: 400,
        message: formatMessageToClient('Error with query; no results returned', err),
    };
}

export function formatQueryDeleteUnitErrorMessage(singleUnitName: string, loggerName: string, id: number, err: any) {

    if (err.code === '23503') { // The unit being deleted is still in use by a table
        const tableName = err.table;
        formatMessageToServer(loggerName, "Couldn't delete " + singleUnitName + " because it is in use", err);

        return {
            errorMessage: formatMessageToClient(singleUnitName + ' could not be deleted - still in use'),
            table: tableName,
            statusCode: 404,
        };
    }

    formatMessageToServer(loggerName, "Couldn't find ID " + id + " for " + singleUnitName, err);
    return {
        errorMessage: formatMessageToClient(singleUnitName + ' not found'),
        statusCode: 404,
        table: '',
    };
}


export function formatQueryPostUnitErrorMessage(singleUnitName: string, loggerName: string, err: any) {
    formatMessageToServer(loggerName, "couldn't insert into table for " + singleUnitName, err);
    return {
        statusCode: 404,
        message: formatMessageToClient(singleUnitName + ' could not be created found- does not exist in records'),
    };
}

export function formatQueryAllUnitsErrorMessage(pluralUnitName: string, loggerName: string, err: any) {
    formatMessageToServer(loggerName, "couldn't query for all " + pluralUnitName, err);
    return {
        statusCode: 400,
        message: formatMessageToClient('Error with query; no results returned', err),
    };
}
