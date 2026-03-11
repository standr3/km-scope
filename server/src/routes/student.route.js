import { Router } from 'express';
import { verifyAccess } from '../middleware/verifyAccess.js';
import { listStudentClasses } from '../controllers/classes.controller.js';
import { listClassProjects } from '../controllers/projects.controller.js';

const router = Router();
router.use(verifyAccess);

router.get('/classes', listStudentClasses);
router.get('/classes/:classId/projects', listClassProjects);

export default router;