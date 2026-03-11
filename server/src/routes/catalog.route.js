import { Router } from 'express';
import { verifyAccess } from '../middleware/verifyAccess.js';
import {
  listProgramsPublic,
  listSubjectsPublic,
  listSchoolYearsPublic,
  listPeriodsPublic
} from '../controllers/catalog.controller.js';

const router = Router();

router.use(verifyAccess);

router.get('/programs', listProgramsPublic);
router.get('/subjects', listSubjectsPublic);
router.get('/school-years', listSchoolYearsPublic);
router.get('/periods', listPeriodsPublic);

export default router;