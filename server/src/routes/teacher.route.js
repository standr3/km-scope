import { Router } from 'express';
import { verifyAccess } from '../middleware/verifyAccess.js';
import { listTeacherClasses } from '../controllers/classes.controller.js';
import { listClassProjects, createProject, updateProject, deleteProject } from '../controllers/projects.controller.js';

const router = Router();
router.use(verifyAccess);

// classes taught by current teacher
router.get('/classes', listTeacherClasses);

// projects under a class
router.get('/classes/:classId/projects', listClassProjects);
router.post('/classes/:classId/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;