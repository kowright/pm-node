import express from 'express';
import { getMilestoneId, getMilestones, createMilestone, deleteMilestoneId, updateMilestoneId } from '../controllers/milestoneController';

const router = express.Router();

//CREATE
router.post('/', createMilestone);

//READ
router.get('/:id', getMilestoneId);

router.get('/', getMilestones);


// UPDATE
router.put('/:id', updateMilestoneId);

// DELETE
router.delete('/:id', deleteMilestoneId);

export default router;
