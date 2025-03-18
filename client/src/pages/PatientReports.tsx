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
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Restaurant as LunchIcon,
  FreeBreakfast as BreakfastIcon,
  DinnerDining as DinnerIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
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

const PatientReports: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mealFilter, setMealFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        console.log('Buscando todos os pacientes para relatórios...');
        
        // Buscar todos os pacientes, incluindo inativos
        const allPatients = await patientService.getAllPatientsIncludingInactive();
        
        console.log('Pacientes recebidos:', allPatients);
        console.log('Total de pacientes:', allPatients.length);
        
        setPatients(allPatients);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar pacientes:', err);
        
        // Log detalhado do erro
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

  // Filtra pacientes com base nos critérios de filtro
  const filteredPatients = patients.filter((patient: Patient) => {
    // Filtro de texto (nome, CPF, telefone, município)
    const textMatch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm) ||
      patient.contact_number.includes(searchTerm) ||
      (patient.municipality && patient.municipality.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de status
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && patient.status === PatientStatus.ACTIVE) ||
      (statusFilter === 'inactive' && patient.status === PatientStatus.INACTIVE);
    
    // Filtro de refeições
    const mealMatch = 
      mealFilter === 'all' || 
      (mealFilter === 'breakfast' && patient.breakfast) ||
      (mealFilter === 'lunch' && patient.lunch) ||
      (mealFilter === 'dinner' && patient.dinner);
    
    // Filtro de data de entrada
    let startDateMatch = true;
    if (startDateFilter) {
      const patientStartDate = patient.start_date || patient.created_at;
      if (patientStartDate) {
        const filterDate = new Date(startDateFilter);
        const patientDate = new Date(patientStartDate);
        startDateMatch = patientDate >= filterDate;
      }
    }
    
    // Filtro de data de saída
    let endDateMatch = true;
    if (endDateFilter) {
      const patientEndDate = patient.end_date || patient.updated_at;
      if (patientEndDate) {
        const filterDate = new Date(endDateFilter);
        const patientDate = new Date(patientEndDate);
        endDateMatch = patientDate <= filterDate;
      }
    }
    
    return textMatch && statusMatch && mealMatch && startDateMatch && endDateMatch;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsDialogOpen(true);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleMealFilterChange = (event: SelectChangeEvent) => {
    setMealFilter(event.target.value);
    setPage(0);
  };

  const handleStartDateFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateFilter(event.target.value);
    setPage(0);
  };

  const handleEndDateFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDateFilter(event.target.value);
    setPage(0);
  };

  const handlePrint = useReactToPrint({
    // @ts-ignore
    content: () => printRef.current,
    documentTitle: 'Relatório de Pacientes',
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
    doc.text('Relatório de Pacientes', 14, 22);
    
    // Informações do filtro
    doc.setFontSize(10);
    let filterText = 'Filtros aplicados: ';
    if (statusFilter !== 'all') {
      filterText += `Status: ${statusFilter === 'active' ? 'Ativos' : 'Inativos'}, `;
    }
    if (mealFilter !== 'all') {
      filterText += `Refeição: ${
        mealFilter === 'breakfast' ? 'Café da manhã' : 
        mealFilter === 'lunch' ? 'Almoço' : 'Jantar'
      }, `;
    }
    if (startDateFilter) {
      filterText += `Data inicial: ${formatDate(startDateFilter)}, `;
    }
    if (endDateFilter) {
      filterText += `Data final: ${formatDate(endDateFilter)}, `;
    }
    if (filterText === 'Filtros aplicados: ') {
      filterText += 'Nenhum';
    } else {
      filterText = filterText.slice(0, -2); // Remover a última vírgula e espaço
    }
    doc.text(filterText, 14, 30);
    
    // Data de geração
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 36);
    
    // Tabela de dados
    const tableColumn = ["Nome", "CPF", "Contato", "Município", "Status", "Refeições", "Entrada", "Saída"];
    const tableRows = filteredPatients.map(patient => [
      patient.name,
      formatCPF(patient.cpf),
      patient.contact_number,
      patient.municipality || '-',
      patient.status === PatientStatus.ACTIVE ? 'Ativo' : 'Inativo',
      [
        patient.breakfast ? 'C' : '',
        patient.lunch ? 'A' : '',
        patient.dinner ? 'J' : ''
      ].filter(Boolean).join('/') || '-',
      formatDate(patient.start_date || patient.created_at),
      formatDate(patient.end_date || patient.updated_at)
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Estatísticas
    const totalPatients = filteredPatients.length;
    const activePatients = filteredPatients.filter(p => p.status === PatientStatus.ACTIVE).length;
    const inactivePatients = filteredPatients.filter(p => p.status === PatientStatus.INACTIVE).length;
    const breakfastCount = filteredPatients.filter(p => p.breakfast).length;
    const lunchCount = filteredPatients.filter(p => p.lunch).length;
    const dinnerCount = filteredPatients.filter(p => p.dinner).length;
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text('Resumo Estatístico', 14, finalY);
    
    doc.setFontSize(10);
    doc.text(`Total de Pacientes: ${totalPatients}`, 14, finalY + 6);
    doc.text(`Pacientes Ativos: ${activePatients}`, 14, finalY + 12);
    doc.text(`Pacientes Inativos: ${inactivePatients}`, 14, finalY + 18);
    doc.text(`Café da Manhã: ${breakfastCount}`, 14, finalY + 24);
    doc.text(`Almoço: ${lunchCount}`, 14, finalY + 30);
    doc.text(`Jantar: ${dinnerCount}`, 14, finalY + 36);
    
    // Salvar o PDF
    doc.save('relatorio-pacientes.pdf');
  };

  // Função para formatar o CPF
  const formatCPF = (cpf: string) => {
    // Retorna o CPF já formatado se estiver no formato correto
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) return cpf;
    
    // Remove caracteres não numéricos
    const numbers = cpf.replace(/\D/g, '');
    
    // Formata o CPF se tiver o número correto de dígitos
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // Retorna o valor original se não for possível formatar
    return cpf;
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

  // Componente de ícone para status de refeição
  const MealStatusIcon = ({ active, type }: { active: boolean, type: 'breakfast' | 'lunch' | 'dinner' }) => {
    const getIcon = () => {
      switch (type) {
        case 'breakfast':
          return <BreakfastIcon color={active ? 'success' : 'error'} fontSize="small" />;
        case 'lunch':
          return <LunchIcon color={active ? 'success' : 'error'} fontSize="small" />;
        case 'dinner':
          return <DinnerIcon color={active ? 'success' : 'error'} fontSize="small" />;
      }
    };

    return (
      <Tooltip title={`${active ? 'Recebia' : 'Não recebia'} ${
        type === 'breakfast' ? 'café da manhã' : type === 'lunch' ? 'almoço' : 'jantar'
      }`}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', mx: 0.5 }}>
          {getIcon()}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Relatório de Pacientes
      </Typography>

      {/* Filtros avançados */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Box display="flex" alignItems="center">
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography>Filtros Avançados</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Buscar por nome, CPF, telefone ou município"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Ativos</MenuItem>
                  <MenuItem value="inactive">Inativos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="meal-filter-label">Refeição</InputLabel>
                <Select
                  labelId="meal-filter-label"
                  id="meal-filter"
                  value={mealFilter}
                  label="Refeição"
                  onChange={handleMealFilterChange}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="breakfast">Café da Manhã</MenuItem>
                  <MenuItem value="lunch">Almoço</MenuItem>
                  <MenuItem value="dinner">Jantar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Entrada (a partir de)"
                type="date"
                value={startDateFilter}
                onChange={handleStartDateFilterChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Saída (até)"
                type="date"
                value={endDateFilter}
                onChange={handleEndDateFilterChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Botões de exportação */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
            onClick={handlePrintClick}
          >
            Imprimir
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
          >
            Exportar PDF
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredPatients.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhum paciente encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <>
          <div ref={printRef}>
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>CPF</TableCell>
                    <TableCell>Contato</TableCell>
                    <TableCell>Município</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Refeições</TableCell>
                    <TableCell>Data de Entrada</TableCell>
                    <TableCell>Data de Saída</TableCell>
                    <TableCell>Observações</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((patient) => (
                      <TableRow key={patient.id} hover>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{formatCPF(patient.cpf)}</TableCell>
                        <TableCell>{patient.contact_number}</TableCell>
                        <TableCell>{patient.municipality || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.status === PatientStatus.ACTIVE ? 'Ativo' : 'Inativo'} 
                            color={patient.status === PatientStatus.ACTIVE ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <MealStatusIcon active={patient.breakfast} type="breakfast" />
                            <MealStatusIcon active={patient.lunch} type="lunch" />
                            <MealStatusIcon active={patient.dinner} type="dinner" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDate(patient.start_date || patient.created_at)}
                        </TableCell>
                        <TableCell>
                          {formatDate(patient.end_date || patient.updated_at)}
                        </TableCell>
                        <TableCell>
                          {patient.observation ? (
                            <Tooltip title="Ver observações">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewDetails(patient)}
                              >
                                <CommentIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalhes">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(patient)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredPatients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </>
      )}

      {/* Diálogo de detalhes do paciente */}
      {selectedPatient && (
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Detalhes do Paciente: {selectedPatient.name}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Informações Pessoais
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nome Completo
                  </Typography>
                  <Typography variant="body1">{selectedPatient.name}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    CPF
                  </Typography>
                  <Typography variant="body1">{formatCPF(selectedPatient.cpf)}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body1">{selectedPatient.contact_number}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Município
                  </Typography>
                  <Typography variant="body1">{selectedPatient.municipality || selectedPatient.creator_username || '-'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Autorizador
                  </Typography>
                  <Typography variant="body1">{selectedPatient.authorizer}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    <Chip 
                      label={selectedPatient.status === PatientStatus.ACTIVE ? 'Ativo' : 'Inativo'} 
                      color={selectedPatient.status === PatientStatus.ACTIVE ? 'success' : 'default'}
                      size="small"
                    />
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Período na Casa de Apoio
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Data de Entrada
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPatient.start_date || selectedPatient.created_at)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Data de Saída
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPatient.end_date || selectedPatient.updated_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Refeições
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                <Box display="flex" alignItems="center">
                  <MealStatusIcon active={selectedPatient.breakfast} type="breakfast" />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {selectedPatient.breakfast ? 'Recebia café da manhã' : 'Não recebia café da manhã'}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <MealStatusIcon active={selectedPatient.lunch} type="lunch" />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {selectedPatient.lunch ? 'Recebia almoço' : 'Não recebia almoço'}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <MealStatusIcon active={selectedPatient.dinner} type="dinner" />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {selectedPatient.dinner ? 'Recebia jantar' : 'Não recebia jantar'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {selectedPatient.observation && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Observações
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {selectedPatient.observation}
                  </Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)} variant="contained">
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default PatientReports; 