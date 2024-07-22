import { Tag } from '../models/Tag';
import { getTags, createTag, updateTagId, deleteTagId } from '../controllers/tagController';

import { Request, Response } from 'express';
import { queryPostgres } from '../database/postgres';
import { validateStringInput1 } from '../utils/validators';

jest.mock('../database/postgres');

describe('getTags', () => {
    const mockRequest = {} as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        send: jest.fn(),
    } as unknown as Response;

    it('should get tags successfully', async () => {
        const mockTagList = [
            { name: 'Tag1', description: 'Description1', id: 1, type_id: 1 },
            { name: 'Tag2', description: 'Description2', id: 2, type_id: 1 },
        ];
        (queryPostgres as jest.Mock).mockResolvedValue(mockTagList);

        await getTags(mockRequest, mockResponse);

        const expectedTags = mockTagList.map(tag => new Tag(tag.name, tag.description, tag.id, tag.type_id));
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith(expectedTags);
    });

    it('should handle error when querying tags', async () => {
        const errorMessage = 'Database error';
        (queryPostgres as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await getTags(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(`[SERVER] Error with query; no results returned | Error: ${errorMessage}`);
    });
});

describe('createTag', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            body: {
                name: 'Tag Name',
                description: 'Tag Description',
            },
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should create tag successfully', async () => {
        // Mock successful queryPostgres response
        const mockQueryResult = [{
            name: 'Tag Name',
            description: 'Tag Description',
            id: 1,
            type_id: 1,
        }];
        (queryPostgres as jest.Mock).mockResolvedValueOnce(mockQueryResult);

        await createTag(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(new Tag('Tag Name', 'Tag Description', 1, 1));
    });

    it('should handle errors when querying tags', async () => {
        const errorMessage = 'Database error';
        (queryPostgres as jest.Mock).mockRejectedValue(new Error(errorMessage));
        const mockResponse = {
            status: jest.fn(() => mockResponse),
            send: jest.fn(),
        } as unknown as Response;
        await createTag(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith(`[SERVER] tag could not be created found- does not exist in records`);
    });
});

describe('updateTagId', () => {
    const mockRequest = { params: { id: '1' }, body: { name: 'UpdatedTag', description: 'UpdatedDescription' } } as unknown as Request;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(), // Mock the json method
        };
    });

    it('should update tag by ID successfully', async () => {
        const mockUpdatedTag = { name: 'UpdatedTag', description: 'UpdatedDescription', id: 1, type_id: 1 };
        (queryPostgres as jest.Mock).mockResolvedValue([mockUpdatedTag]);

        await updateTagId(mockRequest, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith(new Tag(mockUpdatedTag.name, mockUpdatedTag.description, mockUpdatedTag.id, mockUpdatedTag.type_id));
    });

    it('should handle invalid ID', async () => {
        const mockInvalidRequest = { params: { id: 'abc' }, body: { name: 'UpdatedTag', description: 'UpdatedDescription' } } as unknown as Request;

        await updateTagId(mockInvalidRequest, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: '[SERVER] id is not valid' });
    });

    it('should handle validation errors when name is empty', async () => {
        let mockRequest: any;
        let mockResponse: any;

       
        mockRequest = {
            params: { id: '1' },
            body: { name: '', description: 'UpdatedDescription' } 
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        
        const validationResult = validateStringInput1('Name', '', 'TAGS PUT', mockResponse);

        await updateTagId(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(validationResult.statusCode);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: validationResult.message });
    });

    it('should handle error when updating tag by ID', async () => {
        const errorMessage = 'Database error';
        (queryPostgres as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await updateTagId(mockRequest, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(`[SERVER] Error with query; no results returned | Error: ${errorMessage}`);
    });
});


describe('deleteTagId', () => {
    const mockRequest = { params: { id: '1' } } as unknown as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
    } as unknown as Response;

    it('should delete tag by ID successfully', async () => {
        (queryPostgres as jest.Mock).mockResolvedValue(undefined);

        await deleteTagId(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith('deleted');
    });

    it('should handle invalid ID', async () => {
        const mockInvalidRequest: Partial<Request> = { params: { id: 'abc' } };

        await deleteTagId(mockInvalidRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: '[SERVER] id is not valid' });
    });

    it('should handle error when deleting tag by ID', async () => {
        const errorMessage = 'Database error';
        jest.mock('../utils/logger', () => ({
            formatDeleteIdfromDatabaseQuery: jest.fn((entity: string, id: number) => `DELETE FROM ${entity} WHERE id = ${id}`),
            formatQueryDeleteUnitErrorMessage: jest.fn((entity: string, loggerName: string, id: number, error: Error, res: Response) => {
                return res.status(404).json({ error: `Error deleting ${entity}: ${error.message}` });
            }),
        }));

        const mockResponse = {
            status: jest.fn(() => mockResponse),
            send: jest.fn(),
        } as unknown as Response;
        (queryPostgres as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await deleteTagId(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith(`[SERVER] tag not found`);
    });
});