import express from 'express';
import { getAssigneeId, getAssignees, createAssignee, deleteAssigneeId, updateAssigneeId } from '../controllers/assigneeController';

const router = express.Router();

//CREATE
router.post('/', createAssignee);

//READ
router.get('/:id', getAssigneeId);

router.get('/', getAssignees);


// UPDATE
router.put('/:id', updateAssigneeId);

// DELETE
router.delete('/:id', deleteAssigneeId);

export default router;
