// types/express.d.ts
import 'express';

declare global {
    namespace Express {
        interface Request {
            file?: {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                buffer: Buffer;
                size: number;
            };
            files?: any; // Use more specific types if handling multiple files
        }
    }
}
