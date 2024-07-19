import express from 'express';
import { getTaskId, getTasks, createTask, deleteTaskId, updateTaskId } from '../controllers/taskController';

const router = express.Router();

//specific routes get defined first to see if they match then not specific routes

//CREATE
router.post('/', createTask);

//READ
router.get('/:id', getTaskId);

router.get('/', getTasks);


// UPDATE
router.put('/:id', updateTaskId);

// DELETE
router.delete('/:id', deleteTaskId);

export default router;
