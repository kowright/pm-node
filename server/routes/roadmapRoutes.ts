import express from 'express';
import { getRoadmapId, getRoadmaps, createRoadmap, deleteRoadmapId, updateRoadmapId } from '../controllers/roadmapController';

const router = express.Router();

//CREATE
router.post('/', createRoadmap);

//READ
router.get('/:id', getRoadmapId);

router.get('/', getRoadmaps);


// UPDATE
router.put('/:id', updateRoadmapId);

// DELETE
router.delete('/:id', deleteRoadmapId);

export default router;
