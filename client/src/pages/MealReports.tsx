import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Divider,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Restaurant as RestaurantIcon,
  Coffee as BreakfastIcon,
  Fastfood as LunchIcon,
  DinnerDining as DinnerIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { patientService } from '../services/api';
import { Patient, PatientStatus } from '../types/patient';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Adicionar a tipagem para o jsPDF com autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Interface para estatísticas de refeições
interface MealStats {
  period: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

const MealReports: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mealStats, setMealStats] = useState<MealStats[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        console.log('Buscando todos os pacientes para relatórios de refeições...');
        
        // Buscar todos os pacientes, incluindo inativos
        const allPatients = await patientService.getAllPatientsIncludingInactive();
        
        console.log('Pacientes recebidos:', allPatients);
        console.log('Total de pacientes:', allPatients.length);
        
        setPatients(allPatients);
        setError(null);
        
        // Calcular estatísticas iniciais
        calculateMealStats(allPatients);
      } catch (err: any) {
        console.error('Erro ao buscar pacientes:', err);
        
        if (err.response) {
          console.error('Detalhes do erro:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers
          });
        } else if (err.request) {
          console.error('Erro na requisição (sem resposta):', err.request);
        } else {
          console.error('Erro ao configurar requisição:', err.message);
        }
        
        setError('Não foi possível carregar os pacientes. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Recalcular estatísticas quando os filtros mudarem
  useEffect(() => {
    if (patients.length > 0) {
      calculateMealStats(patients);
    }
  }, [periodFilter, startDate, endDate, patients]);

  // Calcular estatísticas de refeições com base nos filtros
  const calculateMealStats = (patientsList: Patient[]) => {
    // Filtrar pacientes pelo período selecionado
    const filteredPatients = patientsList.filter(patient => {
      const patientDate = patient.created_at ? new Date(patient.created_at) : null;
      if (!patientDate) return false;
      
      // Filtrar por período personalizado
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Incluir todo o último dia
        return patientDate >= start && patientDate <= end;
      }
      
      // Filtrar por período predefinido
      const today = new Date();
      const patientDay = patientDate.getDate();
      const patientMonth = patientDate.getMonth();
      const patientYear = patientDate.getFullYear();
      
      switch (periodFilter) {
        case 'today':
          return (
            patientDay === today.getDate() &&
            patientMonth === today.getMonth() &&
            patientYear === today.getFullYear()
          );
        case 'week':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          return patientDate >= oneWeekAgo;
        case 'month':
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(today.getMonth() - 1);
          return patientDate >= oneMonthAgo;
        case 'year':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          return patientDate >= oneYearAgo;
        default:
          return true; // 'all'
      }
    });
    
    // Calcular estatísticas por dia, semana e mês
    const dailyStats: { [key: string]: MealStats } = {};
    const weeklyStats: { [key: string]: MealStats } = {};
    const monthlyStats: { [key: string]: MealStats } = {};
    
    filteredPatients.forEach(patient => {
      if (!patient.created_at) return;
      
      const date = new Date(patient.created_at);
      
      // Formato para dia: DD/MM/YYYY
      const dayKey = date.toLocaleDateString('pt-BR');
      
      // Formato para semana: YYYY-WW (ano-número da semana)
      const weekNumber = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-S${weekNumber}`;
      
      // Formato para mês: MM/YYYY
      const monthKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      // Inicializar estatísticas se não existirem
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { period: dayKey, breakfast: 0, lunch: 0, dinner: 0, total: 0 };
      }
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { period: `Semana ${weekNumber}`, breakfast: 0, lunch: 0, dinner: 0, total: 0 };
      }
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { period: monthKey, breakfast: 0, lunch: 0, dinner: 0, total: 0 };
      }
      
      // Incrementar contadores
      if (patient.breakfast) {
        dailyStats[dayKey].breakfast++;
        weeklyStats[weekKey].breakfast++;
        monthlyStats[monthKey].breakfast++;
      }
      if (patient.lunch) {
        dailyStats[dayKey].lunch++;
        weeklyStats[weekKey].lunch++;
        monthlyStats[monthKey].lunch++;
      }
      if (patient.dinner) {
        dailyStats[dayKey].dinner++;
        weeklyStats[weekKey].dinner++;
        monthlyStats[monthKey].dinner++;
      }
      
      // Incrementar total
      dailyStats[dayKey].total++;
      weeklyStats[weekKey].total++;
      monthlyStats[monthKey].total++;
    });
    
    // Converter para arrays e ordenar por período
    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => {
      const dateA = new Date(a.period.split('/').reverse().join('-'));
      const dateB = new Date(b.period.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime(); // Ordem decrescente
    });
    
    const weeklyStatsArray = Object.values(weeklyStats).sort((a, b) => {
      const weekA = parseInt(a.period.split(' ')[1]);
      const weekB = parseInt(b.period.split(' ')[1]);
      return weekB - weekA; // Ordem decrescente
    });
    
    const monthlyStatsArray = Object.values(monthlyStats).sort((a, b) => {
      const [monthA, yearA] = a.period.split('/');
      const [monthB, yearB] = b.period.split('/');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, 1);
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, 1);
      return dateB.getTime() - dateA.getTime(); // Ordem decrescente
    });
    
    // Definir estatísticas com base no período selecionado
    if (periodFilter === 'today' || periodFilter === 'custom' && startDate === endDate) {
      setMealStats(dailyStatsArray);
    } else if (periodFilter === 'week') {
      setMealStats(dailyStatsArray);
    } else if (periodFilter === 'month') {
      setMealStats(weeklyStatsArray.length > 0 ? weeklyStatsArray : dailyStatsArray);
    } else if (periodFilter === 'year') {
      setMealStats(monthlyStatsArray);
    } else if (periodFilter === 'custom') {
      // Para períodos personalizados, escolher a granularidade com base na duração
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 31) {
        setMealStats(dailyStatsArray);
      } else if (diffDays <= 90) {
        setMealStats(weeklyStatsArray);
      } else {
        setMealStats(monthlyStatsArray);
      }
    } else {
      // 'all' - usar estatísticas mensais
      setMealStats(monthlyStatsArray);
    }
  };

  // Função auxiliar para obter o número da semana
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handlePeriodFilterChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setPeriodFilter(value);
    
    // Resetar datas personalizadas se não estiver usando filtro personalizado
    if (value !== 'custom') {
      const today = new Date();
      
      if (value === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
      } else if (value === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        setStartDate(oneWeekAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (value === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        setStartDate(oneMonthAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (value === 'year') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        setStartDate(oneYearAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (value === 'all') {
        // Não definir datas para 'all'
        setStartDate('');
        setEndDate('');
      }
    }
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
    // Se o período não for personalizado, mudar para personalizado
    if (periodFilter !== 'custom') {
      setPeriodFilter('custom');
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
    // Se o período não for personalizado, mudar para personalizado
    if (periodFilter !== 'custom') {
      setPeriodFilter('custom');
    }
  };

  const handlePrint = useReactToPrint({
    // @ts-ignore
    content: () => printRef.current,
    documentTitle: 'Relatório de Refeições',
    onAfterPrint: () => console.log('Impressão concluída')
  });

  // Função intermediária para lidar com o evento de clique
  const handlePrintClick = () => {
    handlePrint();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título do documento
    doc.setFontSize(18);
    doc.text('Relatório de Refeições', 14, 22);
    
    // Informações do filtro
    doc.setFontSize(10);
    let filterText = 'Período: ';
    
    if (periodFilter === 'custom') {
      filterText += `${formatDate(startDate)} a ${formatDate(endDate)}`;
    } else {
      filterText += periodFilter === 'today' ? 'Hoje' :
                   periodFilter === 'week' ? 'Últimos 7 dias' :
                   periodFilter === 'month' ? 'Último mês' :
                   periodFilter === 'year' ? 'Último ano' : 'Todos os períodos';
    }
    
    doc.text(filterText, 14, 30);
    
    // Data de geração
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 36);
    
    // Tabela de dados
    const tableColumn = ["Período", "Café da Manhã", "Almoço", "Jantar", "Total"];
    const tableRows = mealStats.map(stat => [
      stat.period,
      stat.breakfast.toString(),
      stat.lunch.toString(),
      stat.dinner.toString(),
      stat.total.toString()
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Estatísticas totais
    const totalBreakfast = mealStats.reduce((sum, stat) => sum + stat.breakfast, 0);
    const totalLunch = mealStats.reduce((sum, stat) => sum + stat.lunch, 0);
    const totalDinner = mealStats.reduce((sum, stat) => sum + stat.dinner, 0);
    const totalPatients = mealStats.reduce((sum, stat) => sum + stat.total, 0);
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text('Resumo Estatístico', 14, finalY);
    
    doc.setFontSize(10);
    doc.text(`Total de Café da Manhã: ${totalBreakfast}`, 14, finalY + 6);
    doc.text(`Total de Almoço: ${totalLunch}`, 14, finalY + 12);
    doc.text(`Total de Jantar: ${totalDinner}`, 14, finalY + 18);
    doc.text(`Total de Pacientes: ${totalPatients}`, 14, finalY + 24);
    
    // Salvar o PDF
    doc.save('relatorio-refeicoes.pdf');
  };

  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular totais
  const totalBreakfast = mealStats.reduce((sum, stat) => sum + stat.breakfast, 0);
  const totalLunch = mealStats.reduce((sum, stat) => sum + stat.lunch, 0);
  const totalDinner = mealStats.reduce((sum, stat) => sum + stat.dinner, 0);
  const totalPatients = mealStats.reduce((sum, stat) => sum + stat.total, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Relatório de Refeições
      </Typography>

      {/* Filtros de período */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="period-filter-label">Período</InputLabel>
              <Select
                labelId="period-filter-label"
                id="period-filter"
                value={periodFilter}
                label="Período"
                onChange={handlePeriodFilterChange}
              >
                <MenuItem value="today">Hoje</MenuItem>
                <MenuItem value="week">Últimos 7 dias</MenuItem>
                <MenuItem value="month">Último mês</MenuItem>
                <MenuItem value="year">Último ano</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
                <MenuItem value="all">Todos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              disabled={periodFilter !== 'custom'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Final"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              disabled={periodFilter !== 'custom'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="outlined" 
                startIcon={<PrintIcon />}
                onClick={handlePrintClick}
                fullWidth
              >
                Imprimir
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
                fullWidth
              >
                PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Cards de resumo */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <BreakfastIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Café da Manhã</Typography>
              </Box>
              <Typography variant="h3">{totalBreakfast}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <LunchIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Almoço</Typography>
              </Box>
              <Typography variant="h3">{totalLunch}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DinnerIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Jantar</Typography>
              </Box>
              <Typography variant="h3">{totalDinner}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <RestaurantIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Pacientes</Typography>
              </Box>
              <Typography variant="h3">{totalPatients}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : mealStats.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhum dado encontrado para o período selecionado.
        </Alert>
      ) : (
        <div ref={printRef}>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell align="center">Café da Manhã</TableCell>
                  <TableCell align="center">Almoço</TableCell>
                  <TableCell align="center">Jantar</TableCell>
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mealStats.map((stat, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{stat.period}</TableCell>
                    <TableCell align="center">{stat.breakfast}</TableCell>
                    <TableCell align="center">{stat.lunch}</TableCell>
                    <TableCell align="center">{stat.dinner}</TableCell>
                    <TableCell align="center">{stat.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 'bold', bgcolor: 'action.hover' } }}>
                  <TableCell>TOTAL</TableCell>
                  <TableCell align="center">{totalBreakfast}</TableCell>
                  <TableCell align="center">{totalLunch}</TableCell>
                  <TableCell align="center">{totalDinner}</TableCell>
                  <TableCell align="center">{totalPatients}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </Box>
  );
};

export default MealReports; 