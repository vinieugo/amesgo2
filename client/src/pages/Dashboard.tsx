import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField,
  CircularProgress,
  Divider,
  Alert,
  InputLabel
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Restaurant as RestaurantIcon, 
  Coffee as BreakfastIcon, 
  Fastfood as LunchIcon, 
  RestaurantMenu as DinnerIcon 
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

import { dashboardService } from '../services/api';

// Registro dos componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componente de estatística com ícone
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 56,
              width: 56,
              borderRadius: '50%',
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Grid>
        <Grid item xs>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Página principal de Dashboard
const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<any>(null);
  const [mealStats, setMealStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar estatísticas do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar a data selecionada
        const formattedDate = selectedDate || new Date().toISOString().split('T')[0];
        
        // Carregar estatísticas principais
        const dashboardData = await dashboardService.getStats(formattedDate);
        console.log('Dados do dashboard recebidos:', dashboardData);
        setStats(dashboardData);
        
        // Carregar estatísticas de refeições
        const mealStatsData = await dashboardService.getMealStats('week');
        console.log('Dados de refeições recebidos:', mealStatsData);
        
        // Verificar se os dados estão na estrutura esperada
        let processedMealStats = [];
        if (Array.isArray(mealStatsData)) {
          processedMealStats = mealStatsData;
        } else if (mealStatsData && Array.isArray(mealStatsData.mealStats)) {
          processedMealStats = mealStatsData.mealStats;
        } else {
          console.warn('Formato de dados de refeições inesperado:', mealStatsData);
          processedMealStats = [];
        }
        
        setMealStats(processedMealStats);
        
      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDate]);

  // Configuração do gráfico de barras
  const chartData = {
    labels: mealStats.map(stat => {
      // Formatação simples da data (dd/mm)
      const date = new Date(stat.date);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Café da Manhã',
        data: mealStats.map(stat => stat.breakfast || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      },
      {
        label: 'Almoço',
        data: mealStats.map(stat => stat.lunch || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Janta',
        data: mealStats.map(stat => stat.dinner || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Refeições por Dia (Última Semana)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Manipulador de alteração de data
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
              </Typography>
              <Box sx={{ minWidth: 200 }}>
                <InputLabel htmlFor="date-filter">Filtrar por Data</InputLabel>
                <TextField
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" my={5}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Pacientes Ativos"
                      value={stats?.patientStats?.total || 0}
                      icon={<PersonIcon fontSize="large" />}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Café da Manhã"
                      value={stats?.mealStats?.breakfastToday || 0}
                      icon={<BreakfastIcon fontSize="large" />}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Almoço"
                      value={stats?.mealStats?.lunchToday || 0}
                      icon={<LunchIcon fontSize="large" />}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Janta"
                      value={stats?.mealStats?.dinnerToday || 0}
                      icon={<DinnerIcon fontSize="large" />}
                      color="info"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mt: 3, height: 350 }}>
                  <Bar data={chartData} options={chartOptions} />
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 