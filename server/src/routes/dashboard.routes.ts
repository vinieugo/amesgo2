import { Router } from 'express';
import { getDashboardStats, getMealStats } from '../controllers/dashboard.controller';
import { authenticate, isAdminOrClient } from '../middleware/auth.middleware';

const router = Router();

// Rotas de dashboard (apenas admin e cliente podem visualizar)
router.get('/stats', authenticate, isAdminOrClient, getDashboardStats);
router.get('/meals', authenticate, isAdminOrClient, getMealStats);

export default router; 