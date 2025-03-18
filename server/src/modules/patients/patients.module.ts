import { Router } from 'express';
import { BaseApiModule } from '../../core/base-module';
import { authenticate, isAdmin, isAdminOrClient } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { patientsController } from '../../modules/patients/patients.controller';

/**
 * Módulo de Pacientes
 * Gerencia todas as operações relacionadas a pacientes
 */
export class PatientsModule extends BaseApiModule {
  constructor() {
    super(
      'patients',
      'Gerenciamento de pacientes',
      '1.0.0',
      ['auth'] // Dependência do módulo de autenticação
    );
  }

  /**
   * Configura as rotas do módulo de pacientes
   */
  protected async configureRoutes(): Promise<void> {
    // Criar paciente (qualquer usuário autenticado pode criar)
    this.router.post(
      '/',
      authenticate,
      asyncHandler(patientsController.createPatient)
    );

    // Rotas específicas devem vir antes das rotas com parâmetros dinâmicos
    // Rota para pacientes ativos
    this.router.get(
      '/active',
      authenticate,
      asyncHandler(patientsController.getActivePatients)
    );

    // Rota para pacientes inativos
    this.router.get(
      '/inactive',
      authenticate,
      isAdminOrClient,
      asyncHandler(patientsController.getInactivePatients)
    );

    // Rota para pacientes por data
    this.router.get(
      '/date/:date',
      authenticate,
      asyncHandler(patientsController.getPatientsByDate)
    );

    // Rota para busca avançada
    this.router.post(
      '/search',
      authenticate,
      isAdminOrClient,
      asyncHandler(patientsController.searchPatients)
    );

    // Obter todos os pacientes (admin e cliente podem visualizar)
    this.router.get(
      '/',
      authenticate,
      asyncHandler(patientsController.getAllPatients)
    );

    // Obter paciente por ID (admin e cliente podem visualizar)
    this.router.get(
      '/:id',
      authenticate,
      isAdminOrClient,
      asyncHandler(patientsController.getPatient)
    );

    // Atualizar paciente (admin e cliente podem atualizar)
    this.router.put(
      '/:id',
      authenticate,
      isAdminOrClient,
      asyncHandler(patientsController.updatePatient)
    );

    // Excluir paciente (somente admin)
    this.router.delete(
      '/:id',
      authenticate,
      isAdmin,
      asyncHandler(patientsController.deletePatient)
    );

    // Resetar todos os pacientes (somente admin)
    this.router.post(
      '/reset-all',
      authenticate,
      isAdmin,
      asyncHandler(patientsController.resetAllPatients)
    );

    console.log('Rotas do módulo de pacientes configuradas');
  }

  /**
   * Limpeza específica do módulo
   */
  protected async performCleanup(): Promise<void> {
    // Implementação específica de limpeza, se necessário
    console.log('Limpeza do módulo de pacientes');
  }
}

// Exportar uma instância do módulo para uso no registro
export const patientsModule = new PatientsModule(); 