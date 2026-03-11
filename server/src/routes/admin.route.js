import { Router } from 'express';
import { verifyAccess, requireAdmin } from '../middleware/verifyAccess.js';
import { adminOverview, acceptRequest, revokeMember } from '../controllers/admin.controller.js';
import { listPrograms, createProgram, updateProgram, deleteProgram } from '../controllers/programs.controller.js';
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subjects.controller.js';
import { listSchoolYearsAdmin, createSchoolYear, updateSchoolYear, deleteSchoolYear } from '../controllers/schoolyears.controller.js';
import { listPeriodsAdmin, createPeriod, updatePeriod, deletePeriod } from '../controllers/periods.controller.js';
import { listClassroomsAdmin, createClassroom, updateClassroom, deleteClassroom, listClassroomStudents, addStudentToClassroom, removeStudentFromClassroom } from '../controllers/classrooms.controller.js';
import { listClassesAdmin, createClass, updateClass, deleteClass } from '../controllers/classes.controller.js';

const router = Router();
router.use(verifyAccess, requireAdmin);

router.get('/overview', adminOverview);
router.post('/requests/:id/accept', acceptRequest);
router.post('/members/:membershipId/revoke', revokeMember);

router.get('/programs', listPrograms);
router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.delete('/programs/:id', deleteProgram);

router.get('/subjects', listSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.get('/school-years', listSchoolYearsAdmin);
router.post('/school-years', createSchoolYear);
router.put('/school-years/:id', updateSchoolYear);
router.delete('/school-years/:id', deleteSchoolYear);

router.get('/periods', listPeriodsAdmin);
router.post('/periods', createPeriod);
router.put('/periods/:id', updatePeriod);
router.delete('/periods/:id', deletePeriod);

router.get('/classrooms', listClassroomsAdmin);
router.post('/classrooms', createClassroom);
router.put('/classrooms/:id', updateClassroom);
router.delete('/classrooms/:id', deleteClassroom);
router.get('/classrooms/:id/students', listClassroomStudents);
router.post('/classrooms/:id/students/add', addStudentToClassroom);
router.post('/classrooms/:id/students/remove', removeStudentFromClassroom);

router.get('/classes', listClassesAdmin);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

export default router;