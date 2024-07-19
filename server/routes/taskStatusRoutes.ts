import express from 'express';
import { getTaskStatusId, getTaskStatuses, createTaskStatus, deleteTaskStatusId, updateTaskStatusId } from '../controllers/taskStatusController';

const router = express.Router();

//CREATE
router.post('/', createTaskStatus);

//READ
router.get('/:id', getTaskStatusId);

router.get('/', getTaskStatuses);


// UPDATE
router.put('/:id', updateTaskStatusId);

// DELETE
router.delete('/:id', deleteTaskStatusId);

export default router;
