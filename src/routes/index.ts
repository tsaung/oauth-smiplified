import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as UserController from '../controllers/user.controller';

const router = Router();

// --- Auth Routes ---
router.get('/login', AuthController.handleLogin);
router.get('/callback', AuthController.handleCallback);
router.get('/logout', AuthController.handleLogout);

// --- User/Page Routes ---
router.get('/', UserController.showDashboard);
router.get('/repos', UserController.showRepos);

export default router;
