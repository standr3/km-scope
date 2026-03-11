import { Router } from 'express';
import { signup, login, logout, refresh, checkAuth, registerSchool, registerMember } from '../controllers/auth.controller.js';
import { verifyAccess } from '../middleware/verifyAccess.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/check-auth', verifyAccess, checkAuth);

router.post('/register-school', registerSchool);
router.post('/register-member', registerMember);

export default router;