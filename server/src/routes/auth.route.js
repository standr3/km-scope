import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refresh,
  checkAuth,
  registerSchool,
  // registerMember,
  checkOrganizationAccess,
  setupOrganizationAdmin,
  checkMemberInvite,
  acceptMemberInvite,
} from '../controllers/auth.controller.js';
import { verifyAccess } from '../middleware/verifyAccess.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/check-auth', verifyAccess, checkAuth);

router.post('/register-school', registerSchool);

// legacy public member signup disabled
// router.post('/register-member', registerMember);

router.post('/organization/check-access', checkOrganizationAccess);
router.post('/organization/setup-admin', setupOrganizationAdmin);

router.post('/member/check-invite', checkMemberInvite);
router.post('/member/accept-invite', acceptMemberInvite);

export default router;



