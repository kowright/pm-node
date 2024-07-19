import { Request, Response } from 'express';
import { formatDeleteIdfromDatabaseQuery, formatSelectAllFromTable, formatSelectIdfromDatabaseQuery } from '../database/queries';
import { formatMessageToClient, formatMessageToServer, formatQueryAllUnitsErrorMessage, formatQueryDeleteUnitErrorMessage, formatQueryPostUnitErrorMessage, formatQuerySingleUnitErrorMessage } from '../utils/logger';
import { queryPostgres } from '../database/postgres';
import { validateDateInput, validateNumberInput, validateStringInput, validateArrayOfNumbersInput, isBooleanStringValidator } from '../utils/validators';
import Milestone from '../models/Milestone';
import Tag from '../models/Tag';
import Roadmap from '../models/Roadmap';
import { fetchData } from '../utils/fetchEndpoint';
import TaskStatus from '../models/TaskStatus';

const loggerUnit = 'MILESTONE';

export const getMilestones = async (req: Request, res: Response) => {
    const { roadmaps, tags } = req.query;

    const loggerName = 'MILESTONES GET';

    if (roadmaps && !isBooleanStringValidator(roadmaps as String) || (tags && !isBooleanStringValidator(tags as String))) {
        console.log("error: parameters must be in correct format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }

    // #region Queries 

    const q: string = formatSelectAllFromTable('Milestone');

    const roadmapQ: string =
        `SELECT r.*
    FROM Roadmap r
    JOIN RoadmapMilestone rm ON r.id = rm.roadmap_id
    WHERE rm.milestone_id = $1;`;

    const tagsQ: string =
        `SELECT t.*
    FROM Tag t
    JOIN MilestoneTag mt ON t.id = mt.tag_id
    WHERE mt.milestone_id = $1;`;

    const taskStatusQ =
        `SELECT t.*
    FROM TaskStatus t
    JOIN Milestone m ON t.id = m.status_id
    WHERE m.id = $1;`

    // #endregion

    let list: any[] = [];
    try {
        list = await queryPostgres(q);
    } catch (err) {
        formatQueryAllUnitsErrorMessage('milestones', loggerName, err, res);
    }

    if (list.length === 0) {
        formatMessageToServer(loggerName, "couldn't query for all milestones");
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    };

    let milestoneList: Milestone[] = [];

    await Promise.all(list.map(async (ms) => {

        const roadmapArray: Roadmap[] = [];
        try {
            if (roadmaps === 'true') {
                const roadmapList: any[] = await queryPostgres(roadmapQ, [ms.id]);
                roadmapList.forEach(roadmap => {
                    roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't execute roadmapQ", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        }

        const tagArray: Tag[] = [];
        try {
            if (tags === 'true') {
                const tagsList: any[] = await queryPostgres(tagsQ, [ms.id]);
                tagsList.forEach(tag => {
                    tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
                });
            };
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't execute tagQ", err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned'));
        }

        let taskStatus: TaskStatus = new TaskStatus('', '', 0, 0); // placeholder value
        try {
            const status = await queryPostgres(taskStatusQ, [ms.id]);
            if (status.length > 0) {
                const statusObject = status[0];
                taskStatus = new TaskStatus(statusObject.name, statusObject.description, statusObject.id, statusObject.type_id);
            }
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't fetch a task status for a milestone from postgres", err);
            res.status(404).json(formatMessageToClient('Error with query', err));
        }

        milestoneList.push(new Milestone(ms.name, ms.description, roadmapArray, tagArray, ms.date, taskStatus,
            ms.id, ms.type_id));
    }));

    res.status(200).send(milestoneList);
}

export const getMilestoneId = async (req: Request, res: Response) => {
    const { roadmaps, tags } = req.query;
    const id = parseInt(req.params.id);

    const loggerName = 'MILESTONES ID GET';

    if ((roadmaps && !isBooleanStringValidator(roadmaps)) || (tags && !isBooleanStringValidator(tags))) {
        formatMessageToServer(loggerName, "roadmap and or tag are not in corret format");
        return res.status(400).json({ error: 'Parameters must be in correct format' });
    }


    validateNumberInput(id, 'id for milestone is invalid', loggerName, res);

    // #region Queries 

    const q: string = formatSelectIdfromDatabaseQuery('Milestone', id);

    const roadmapQ: string =
        `SELECT r.*
        FROM Roadmap r
        JOIN RoadmapMilestone rm ON r.id = rm.roadmap_id
        WHERE rm.milestone_id = $1;`;

    const tagsQ: string =
        `SELECT t.*
        FROM Tag t
        JOIN MilestoneTag mt ON t.id = mt.tag_id
        WHERE mt.milestone_id = $1;`;

    const taskStatusQ =
        `SELECT t.*
        FROM TaskStatus t
        JOIN Milestone m ON t.id = m.status_id
        WHERE m.id = $1;`

    // #endregion

    let queriedItem: any;
    try {
        queriedItem = await queryPostgres(q);
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't query for this milestone id " + id, err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    }
    const item = queriedItem[0];

    const roadmapArray: Roadmap[] = [];
    try {
        if (roadmaps === 'true') {
            const roadmapList: any[] = await queryPostgres(roadmapQ, [item.id]);
            roadmapList.forEach(roadmap => {
                roadmapArray.push(new Roadmap(roadmap.name, roadmap.description, roadmap.id, roadmap.type));
            });
        }
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't execute roadmapQ", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    }

    const tagArray: Tag[] = [];
    try {
        if (tags === 'true') {
            const tagsList: any[] = await queryPostgres(tagsQ, [item.id]);
            tagsList.forEach(tag => {
                tagArray.push(new Tag(tag.name, tag.description, tag.id, tag.type));
            });
        }
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't execute tagQ", err);
        res.status(400).send(formatMessageToClient('Error with query; no results returned'));
    }

    let taskStatus: TaskStatus = new TaskStatus('', '', 0, 0);
    try {
        const status = await queryPostgres(taskStatusQ, [item.id]);
        const statusObject = status[0];
        taskStatus = new TaskStatus(statusObject.name, statusObject.description, statusObject.id, statusObject.type_id);
    } catch (err) {
        formatMessageToServer(loggerName, "couldn't fetch a task status for a milestone from postgres", err);
        res.status(404).json(formatMessageToClient('Error with query', err));
    }

    const newItem = new Milestone(item.name, item.description, roadmapArray, tagArray,
        item.date, taskStatus, item.id, item.type_id);

    res.send(newItem);
}

export const createMilestone = async (req: Request, res: Response) => {
    const { name, description, date, taskStatus, tags, roadmaps } = req.body;

    const loggerName = 'MILESTONES POST';

    // #region Validation
    validateStringInput('Name', name, loggerName, res);
    validateStringInput('Description', description, loggerName, res)
    validateDateInput('Date', date, loggerName, res);
    validateNumberInput(taskStatus, 'Task Status is not valid', loggerName, res);
    validateArrayOfNumbersInput('tags', tags, loggerName, res);
    validateArrayOfNumbersInput('roadmaps', roadmaps, loggerName, res);
    // #endregion

    // #region Queries 

    const q: string = `
    INSERT INTO Milestone (name, description, date, status_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
`;

    const insertIntoMilestoneTag = `
    INSERT INTO MilestoneTag (milestone_id, tag_id)
    VALUES ($1, $2)
    `

    const insertIntoRoadmapMilestone = `
    INSERT INTO RoadmapMilestone (roadmap_id, milestone_id)
    VALUES ($1, $2)
    `

    // #endregion

    let newItem: any;
    try {
        newItem = await queryPostgres(q, [name, description, date, taskStatus]);
    } catch (err) {
        formatQueryPostUnitErrorMessage('milestone', loggerName, err, res);
    }
    const tagArray: number[] = Array.isArray(tags) ? tags : JSON.parse(tags);

    //let clientMessage: string = 'Milestone successfully made.\n';
    await Promise.all(tagArray.map(async (tagId) => {
        try {
            await queryPostgres(insertIntoMilestoneTag, [newItem[0].id, tagId]);
        }
        catch (err: any) {
            if (err.code === '23505') {
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name, err);

                // clientMessage += 'Tag is already attached to milestone \n'
            }
            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name);

                // clientMessage += 'Tags given does not exist but milestone still was made. \n'
            }
        }
    }));

    const roadmapArray: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
    await Promise.all(roadmapArray.map(async (mapId) => {
        try {
            const res = await queryPostgres(insertIntoRoadmapMilestone, [mapId, newItem[0].id,]);
        }
        catch (err: any) {
            if (err.code === '23505') {
                formatMessageToServer(loggerName, "Duplicate entry but its fine for " + name, err);
                // clientMessage += 'Roadmap is already attached to milestone.\n'
            }

            if (err.code === '23503') {
                formatMessageToServer(loggerName, "Tags given don't exist but item was still made for " + name);

                // clientMessage += 'Roadmaps given does not exist but milestone still was made. \n'
            }
        }
    }));

    //remake milestone
    let fullMilestone;
    try {
        const url = '/api/milestones/' + newItem[0].id + '?roadmaps=true&tags=true';
        fullMilestone = await fetchData(url);
    } catch (error) {
        formatQuerySingleUnitErrorMessage('milestone', loggerName, newItem[0].id, error, res);
    }

    res.status(201).json(fullMilestone);
}

export const updateMilestoneId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const { name, description, date, taskStatus_id, tags, roadmaps } = req.body;

    const loggerName = 'MILESTONES PUT';

    const putMilestone: Milestone = req.body;

    // #region Validation
    validateNumberInput(id, 'Could not proccess milestone due to its ID', loggerName, res);
    validateStringInput("Name", name, loggerName, res);
    validateStringInput("Description", name, loggerName, res);
    validateDateInput('Date', date, loggerName, res);
    taskStatus_id && validateNumberInput(taskStatus_id, 'Task Status is not valid for ' + name, loggerName, res);
    if (tags) {
        const sentTags = tags as Tag[];
        const tagIds = sentTags.map(tag => tag.id);
        validateArrayOfNumbersInput('tag ids', tagIds, loggerName, res);
    }
    if (roadmaps) {
        const sentRoadmaps = roadmaps as Roadmap[];
        const roadmapIds = sentRoadmaps.map(map => map.id);
        validateArrayOfNumbersInput('roadmap ids', roadmapIds, loggerName, res);
    }
    // #endregion

    // #region Queries 

    const insertRowIntoMilestoneTagQ = `
    INSERT INTO MilestoneTag (milestone_id, tag_id)
    VALUES ($1, $2)
    `;

    const insertRowIntoRoadmapMilestoneQ = `
    INSERT INTO RoadmapMilestone (roadmap_id, milestone_id)
    VALUES ($1, $2)
    `;

    const updateMilestoneQ = `
    UPDATE Milestone
    SET name = $1,
        description = $2,
        date = $3,
        status_id = $4
    WHERE id = $5
    RETURNING *;
  `;

    const getAllRowsFromMilestoneTagByMilestoneIdQ = `
    SELECT *
    FROM MilestoneTag
	WHERE milestone_id = $1;
    ` ;

    const getAllRowsFromRoadmapMilestoneByMilestoneIdQ = `
    SELECT *
    FROM RoadmapMilestone
	WHERE milestone_id = $1;
    ` ;

    const deleteRowFromMilestoneTagQ = `
    DELETE FROM MilestoneTag WHERE milestone_id = $1 AND tag_id = $2
    `;

    const deleteRowFromRoadmapMilestoneQ = `
    DELETE FROM RoadmapMilestone WHERE roadmap_id = $1 AND milestone_id = $2
    `;

    // #endregion

    let item: any;

    try {
        item = await queryPostgres(updateMilestoneQ, [name, description, date, putMilestone.taskStatus.id, id]);
    } catch (err) {
        formatQuerySingleUnitErrorMessage('milestone', loggerName, id, err, res);
    }

    //tags
    let newTagRows: any[] = [];
    let dbTagRows: any[] = [];
    try {
        dbTagRows = await queryPostgres(getAllRowsFromMilestoneTagByMilestoneIdQ, [id]);
        const tagArrayFromParams: Tag[] = Array.isArray(tags) ? tags : JSON.parse(tags);

        tagArrayFromParams.map(tag => {
            newTagRows.push({
                milestone_id: id,
                tag_id: tag.id
            });
        });
    } catch (err) {
        formatQueryAllUnitsErrorMessage('tags for milestone', loggerName, err, res);
    }

    const rowsToDelete = dbTagRows.filter(dbRow =>
        !newTagRows.some(newRow => newRow.milestone_id === dbRow.milestone_id && newRow.tag_id === dbRow.tag_id)
    );

    const rowsToInsert = newTagRows.filter(newRow =>
        !dbTagRows.some(dbRow => dbRow.milestone_id === newRow.milestone_id && dbRow.tag_id === newRow.tag_id)
    );

    await Promise.all(rowsToDelete.map(async row => {
        try {
            await queryPostgres(deleteRowFromMilestoneTagQ, [row.milestone_id, row.tag_id]);
        } catch (err) {
            formatMessageToServer(loggerName, "couldn't delete tag rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    await Promise.all(rowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoMilestoneTagQ, [row.milestone_id, row.tag_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add tag rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    //roadmaps
    let dbRoadmapRows: any[] = [];
    let newRoadmapRows: any[] = [];
    try {
        dbRoadmapRows = await queryPostgres(getAllRowsFromRoadmapMilestoneByMilestoneIdQ, [id]);
        let roadmapArrayFromParams: number[] = Array.isArray(roadmaps) ? roadmaps : JSON.parse(roadmaps);
        roadmapArrayFromParams = putMilestone.roadmaps.map(map => map.id);
        roadmapArrayFromParams.map(map => {
            newRoadmapRows.push({
                roadmap_id: map,
                milestone_id: id
            });
        });
    } catch (err) {
        formatQueryAllUnitsErrorMessage('roadmaps for milestone', loggerName, err, res);
    }


    const roadmapRowsToDelete = dbRoadmapRows.filter(dbRow =>
        !newTagRows.some(newRow => newRow.milestone_id === dbRow.milestone_id && newRow.roadmap_id === dbRow.roadmap_id)
    );
    const roadmapRowsToInsert = newRoadmapRows.filter(newRow =>
        !dbTagRows.some(dbRow => dbRow.milestone_id === newRow.milestone_id && dbRow.roadmap_id === newRow.roadmap_id)
    );

    await Promise.all(roadmapRowsToDelete.map(async row => {
        try {
            await queryPostgres(deleteRowFromRoadmapMilestoneQ, [row.roadmap_id, row.milestone_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't delete roadmap rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));

    await Promise.all(roadmapRowsToInsert.map(async row => {
        try {
            await queryPostgres(insertRowIntoRoadmapMilestoneQ, [row.roadmap_id, row.milestone_id]);

        } catch (err) {
            formatMessageToServer(loggerName, "couldn't add roadmap rows for milestone " + id, err);
            res.status(400).send(formatMessageToClient('Error with query; no results returned', err));
        }
    }));


    res.status(201).json(putMilestone);
}

export const deleteMilestoneId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const loggerName = 'MILESTONES POST';

    validateNumberInput(id, 'Assignee ID is not valid', loggerName, res);

    const q = formatDeleteIdfromDatabaseQuery('Milestone', id);

    try {
        const result = await queryPostgres(q);

        if (result.length === 0) {
            res.status(200).json('deleted');
        } else {
            res.status(404).json(formatMessageToClient('Milestone not found- does not exist in records'));
        }
    } catch (err) {
        formatQueryDeleteUnitErrorMessage('milestone', loggerName, id, err, res);
    };
}

function isArrayOfNumbersValidator(tagIds: any[]) {
    throw new Error('Function not implemented.');
}
