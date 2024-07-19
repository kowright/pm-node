import express from 'express';
import { getUnitTypesId, getUnitTypes, updateUnitTypesId } from '../controllers/unitTypesController';

const router = express.Router();

//CREATE

//READ
router.get('/:id', getUnitTypesId);

router.get('/', getUnitTypes);

// UPDATE
router.put('/:id', updateUnitTypesId);

// DELETE

export default router;
