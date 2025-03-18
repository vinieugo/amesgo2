import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Rotas públicas
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-token', authController.verifyToken);

// Rotas protegidas (requerem autenticação)
router.post('/encrypt', authenticate, authController.encryptData);
router.post('/decrypt', authenticate, authController.decryptData);

export default router; 