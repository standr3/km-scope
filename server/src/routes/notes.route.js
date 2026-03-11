import { Router } from 'express';
import { verifyAccess } from '../middleware/verifyAccess.js';
import { requireMemberActive } from '../middleware/requireMemberActive.js';
import { listNotes, getNote, createNote, updateNote, deleteNote } from '../controllers/notes.controller.js';

const router = Router();

router.use(verifyAccess, requireMemberActive);
router.get('/', listNotes);
router.get('/:id', getNote);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;