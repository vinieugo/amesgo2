import { Router } from 'express';
import { BaseApiModule } from '../../core/base-module';
import { authenticate, isAdmin } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { reportsController } from '../../modules/reports/reports.controller';

/**
 * Módulo de Relatórios
 * Gerencia todas as operações relacionadas a relatórios e estatísticas
 */
export class ReportsModule extends BaseApiModule {
  constructor() {
    super(
      'reports',
      'Geração de relatórios e estatísticas',
      '1.0.0',
      ['patients', 'auth'] // Dependências
    );
  }

  /**
   * Configura as rotas do módulo de relatórios
   */
  protected async configureRoutes(): Promise<void> {
    // Relatório de pacientes por município
    this.router.get(
      '/patients/by-municipality',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.getPatientsByMunicipality)
    );

    // Relatório de refeições servidas por período
    this.router.get(
      '/meals/by-period',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.getMealsByPeriod)
    );

    // Relatório de pacientes ativos vs. inativos
    this.router.get(
      '/patients/status-summary',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.getPatientStatusSummary)
    );

    // Relatório de atividade diária
    this.router.get(
      '/activity/daily',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.getDailyActivity)
    );

    // Exportar relatório em CSV
    this.router.get(
      '/export/csv/:reportType',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.exportReportToCsv)
    );

    // Exportar relatório em PDF
    this.router.get(
      '/export/pdf/:reportType',
      authenticate,
      isAdmin,
      asyncHandler(reportsController.exportReportToPdf)
    );

    // Dashboard com estatísticas gerais
    this.router.get(
      '/dashboard',
      authenticate,
      asyncHandler(reportsController.getDashboardStats)
    );

    // Rota específica para estatísticas do dashboard
    this.router.get(
      '/dashboard/stats',
      authenticate,
      asyncHandler(reportsController.getDashboardStats)
    );

    // Rota para estatísticas de refeições do dashboard
    this.router.get(
      '/dashboard/meals',
      authenticate,
      asyncHandler(reportsController.getDashboardMealStats)
    );

    console.log('Rotas do módulo de relatórios configuradas');
  }

  /**
   * Limpeza específica do módulo
   */
  protected async performCleanup(): Promise<void> {
    // Implementação específica de limpeza, se necessário
    console.log('Limpeza do módulo de relatórios');
  }
}

// Exportar uma instância do módulo para uso no registro
export const reportsModule = new ReportsModule(); 