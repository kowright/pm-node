import express from 'express';
import { getTagId, getTags, createTag, deleteTagId, updateTagId } from '../controllers/tagController';

const router = express.Router();

//CREATE
router.post('/', createTag);

//READ
router.get('/:id', getTagId);

router.get('/', getTags);


// UPDATE
router.put('/:id', updateTagId);

// DELETE
router.delete('/:id', deleteTagId);

export default router;
