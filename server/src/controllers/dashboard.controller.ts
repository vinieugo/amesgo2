import { Request, Response } from 'express';
import pool from '../config/db';

// Obter estatísticas gerais para o dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Obter data para filtro
    const { date, includeInactive } = req.query;
    let dateFilter = '';
    let dateParam: string[] = [];

    // Se uma data for especificada, adiciona condição ao filtro
    if (date && typeof date === 'string') {
      // Se includeInactive for true, não filtra por status
      if (includeInactive === 'true') {
        dateFilter = 'WHERE DATE(created_at) = ?';
      } else {
        dateFilter = 'WHERE DATE(created_at) = ? AND status = "ACTIVE"';
      }
      dateParam = [date];
    } else {
      // Se includeInactive for true, não filtra por status
      if (includeInactive === 'true') {
        dateFilter = '';
      } else {
        dateFilter = 'WHERE status = "ACTIVE"';
      }
    }

    // Consulta para contar o total de pacientes
    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM patients ${dateFilter}`,
      dateParam
    );
    const total = (totalResult as any)[0].total;

    // Consulta para contar pacientes por refeição
    const [mealStats] = await pool.execute(`
      SELECT 
        SUM(breakfast) as breakfast_count,
        SUM(lunch) as lunch_count,
        SUM(dinner) as dinner_count
      FROM patients ${dateFilter}
    `, dateParam);

    // Consulta para distribuição dos pacientes por dia (últimos 7 dias)
    // Se includeInactive for true, não filtra por status
    let dailyStatsFilter = 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    if (includeInactive !== 'true') {
      dailyStatsFilter += ' AND status = "ACTIVE"';
    }

    const [dailyStats] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count 
      FROM patients
      ${dailyStatsFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.status(200).json({
      total,
      meals: {
        breakfast: (mealStats as any)[0].breakfast_count || 0,
        lunch: (mealStats as any)[0].lunch_count || 0,
        dinner: (mealStats as any)[0].dinner_count || 0
      },
      dailyStats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas do dashboard' });
  }
};

// Obter contagem detalhada de refeições por período de tempo
export const getMealStats = async (req: Request, res: Response) => {
  try {
    // Obter período para filtro (dia, semana, mês, todos)
    const { period, includeInactive } = req.query;
    let dateFilter = includeInactive === 'true' ? '' : 'WHERE status = "ACTIVE"';

    if (period) {
      switch (period) {
        case 'day':
          dateFilter = includeInactive === 'true' 
            ? 'WHERE DATE(created_at) = CURDATE()' 
            : 'WHERE DATE(created_at) = CURDATE() AND status = "ACTIVE"';
          break;
        case 'week':
          dateFilter = includeInactive === 'true'
            ? 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
            : 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = "ACTIVE"';
          break;
        case 'month':
          dateFilter = includeInactive === 'true'
            ? 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
            : 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = "ACTIVE"';
          break;
        // Para 'all' ou qualquer outro valor, mantém o filtro definido anteriormente
      }
    }

    // Consulta para contagem detalhada de refeições
    const [mealStatsDetailed] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(breakfast) as breakfast_count,
        SUM(lunch) as lunch_count,
        SUM(dinner) as dinner_count,
        COUNT(*) as total_patients
      FROM patients
      ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.status(200).json({
      mealStats: mealStatsDetailed
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas detalhadas de refeições:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas detalhadas de refeições' });
  }
}; 