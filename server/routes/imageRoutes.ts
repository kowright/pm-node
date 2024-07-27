import express from 'express';
import { getImage, uploadImage } from '../controllers/imageController';
const multer = require('multer');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// CREATE
// Apply multer middleware here
router.post('/', upload.single('image'), uploadImage);

// READ
router.get('/:id', getImage);

export default router;
