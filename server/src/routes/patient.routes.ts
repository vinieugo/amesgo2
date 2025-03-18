import { Router } from 'express';
import { 
  createPatientController, 
  getPatientByIdController, 
  getAllPatientsController, 
  updatePatientController, 
  deletePatientController 
} from '../controllers/patient.controller';
import { authenticate, isAdmin, isAdminOrClient, isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

// Criar paciente (qualquer usuário autenticado pode criar)
router.post('/', authenticate, isAuthenticated, createPatientController);

// Obter todos os pacientes (admin e cliente podem visualizar)
router.get('/', authenticate, isAdminOrClient, getAllPatientsController);

// Obter paciente por ID (admin e cliente podem visualizar)
router.get('/:id', authenticate, isAdminOrClient, getPatientByIdController);

// Atualizar paciente (admin e cliente podem atualizar)
router.put('/:id', authenticate, isAdminOrClient, updatePatientController);

// Excluir paciente (somente admin)
router.delete('/:id', authenticate, isAdmin, deletePatientController);

export default router; 