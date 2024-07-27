import { Request, Response } from 'express';
import { queryPostgres } from '../database/postgres';
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const loggerName = 'IMAGE';

export const uploadImage = async (req: Request, res: Response) => {
    const loggerName = 'IMAGE POST';

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { originalname, buffer } = req.file;

    const q = 'INSERT INTO images (filename, image_data) VALUES ($1, $2)'
    try {
        await queryPostgres(q, [originalname, buffer]);
        res.send('File uploaded successfully.');
    } catch (error) {
        console.error('Error inserting file into database:', error);
        res.status(500).send('Server error.');
    }
}

export const getImage = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const q = 'SELECT filename, image_data FROM images WHERE id = $1'

    try {
        const result = await queryPostgres(q, [id]);
        console.log("getImage", result)
        const image = result[0];

        if (!image) {
            return res.status(404).send('Image not found.');
        }

        res.setHeader('Content-Type', 'image/jpeg');
        res.send(image.image_data);
    } catch (error) {
        console.error('Error retrieving file from database:', error);
        res.status(500).send('Server error.');
    }
}

/*export const getAssignees = async (req: Request, res: Response) => {
    const loggerName = 'ASSIGNEES GET';

    const q: string = formatSelectAllFromTable('Assignee');

    let list: any[] = [];

    try {
        list = await queryPostgres(q);
    } catch (err) {
        const { statusCode, message } = formatQueryAllUnitsErrorMessage('tags', loggerName, err);
        return res.status(statusCode).send(message);
    }

    const newList: Assignee[] = [];
    list.map(a => {
        newList.push(new Assignee(a.name, a.description, a.id, a.type_id))
    });

    return res.status(200).send(newList);
}
*/