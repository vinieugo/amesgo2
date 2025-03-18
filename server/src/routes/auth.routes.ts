import { Router } from 'express';
import { register, login, getProfile, getAllUsersController } from '../controllers/auth.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Rota de registro (apenas para admin)
router.post('/register', authenticate, isAdmin, register);

// Rota de login
router.post('/login', login);

// Rota de perfil
router.get('/profile', authenticate, getProfile);

// Rota para listar usuários (apenas admin)
router.get('/users', authenticate, isAdmin, getAllUsersController);

export default router; 