import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Patient, PatientStatus } from '../types/patient';
import { patientService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const PatientsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [savingPatient, setSavingPatient] = useState(false);

  // Verificar se o usuário tem permissão para editar
  const canEdit = user?.role === UserRole.ADMIN;

  // Buscar lista de pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando pacientes ativos para a listagem...');
        
        const data = await patientService.getAllPatients();
        console.log('Pacientes recebidos do servidor:', data);
        console.log('Total de pacientes recebidos:', data.length);
        
        // Verificar se há pacientes com status indefinido
        const undefinedStatusPatients = data.filter(patient => patient.status === undefined);
        if (undefinedStatusPatients.length > 0) {
          console.warn('Pacientes com status indefinido:', undefinedStatusPatients);
        }
        
        // Verificar se há pacientes inativos na lista
        const inactivePatients = data.filter(patient => patient.status === PatientStatus.INACTIVE);
        if (inactivePatients.length > 0) {
          console.warn('Pacientes inativos na lista de ativos:', inactivePatients);
        }
        
        setPatients(data);
        setFilteredPatients(data);
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
        
        setError('Não foi possível carregar a lista de pacientes. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filtrar pacientes pelo termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => 
      patient.name.toLowerCase().includes(lowercaseSearch) ||
      patient.cpf.includes(lowercaseSearch) ||
      patient.contact_number.includes(lowercaseSearch) ||
      (patient.full_name && patient.full_name.toLowerCase().includes(lowercaseSearch)) ||
      (patient.municipality && patient.municipality.toLowerCase().includes(lowercaseSearch)) ||
      (patient.creator_username && patient.creator_username.toLowerCase().includes(lowercaseSearch))
    );
    
    setFilteredPatients(filtered);
    setPage(0); // Voltar para a primeira página ao filtrar
  }, [searchTerm, patients]);

  // Manipuladores de paginação
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Exibir indicadores para refeições
  const getMealStatus = (patient: Patient, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    // Verificar tanto os campos novos quanto os antigos
    const isEnabled = 
      (mealType === 'breakfast' && (patient.breakfast || patient.has_coffee)) ||
      (mealType === 'lunch' && (patient.lunch || patient.has_lunch)) ||
      (mealType === 'dinner' && patient.dinner);
    
    return (
      <Chip 
        label={isEnabled ? 'Sim' : 'Não'} 
        color={isEnabled ? 'success' : 'error'} 
        size="small" 
        sx={{ minWidth: 60 }}
      />
    );
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

  // Navegar para a página de detalhes do paciente
  const handleViewPatient = (id: number) => {
    navigate(`/patients/${id}`);
  };

  // Abrir diálogo de edição do paciente
  const handleEditPatient = (id: number) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setCurrentPatient(patient);
      setEditFormData({
        name: patient.name,
        cpf: patient.cpf,
        contact_number: patient.contact_number,
        authorizer: patient.authorizer,
        municipality: patient.municipality || patient.creator_username || '',
        breakfast: patient.breakfast,
        lunch: patient.lunch,
        dinner: patient.dinner,
        start_date: patient.start_date,
        end_date: patient.end_date,
        observation: patient.observation || '',
        initial_observation: patient.initial_observation || ''
      });
      setEditDialogOpen(true);
    }
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com mudanças nos campos de refeição
  const handleFormMealChange = (field: string, value: boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar as alterações do paciente
  const handleSavePatient = async () => {
    if (!currentPatient || !currentPatient.id) return;
    
    try {
      setSavingPatient(true);
      
      // Criar objeto com apenas os campos que foram alterados
      const changedFields: Partial<Patient> = {};
      
      // Comparar cada campo para ver se foi alterado
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== (currentPatient as any)[key]) {
          (changedFields as any)[key] = value;
        }
      });
      
      // Se não houver alterações, apenas fechar o diálogo
      if (Object.keys(changedFields).length === 0) {
        setEditDialogOpen(false);
        return;
      }
      
      console.log('Campos alterados:', changedFields);
      
      // Atualizar o paciente com os campos alterados
      const updatedPatient = await patientService.updatePatient(currentPatient.id, changedFields);
      
      // Atualizar a lista de pacientes
      setPatients(prevPatients => 
        prevPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
      );
      
      // Atualizar a lista filtrada
      setFilteredPatients(prevFiltered => 
        prevFiltered.map(p => p.id === updatedPatient.id ? updatedPatient : p)
      );
      
      // Fechar o diálogo
      setEditDialogOpen(false);
      
      // Exibir mensagem de sucesso
      console.log('Paciente atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      alert('Erro ao atualizar paciente. Tente novamente.');
    } finally {
      setSavingPatient(false);
    }
  };

  // Excluir paciente (soft delete)
  const handleDeletePatient = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este paciente?')) return;

    try {
      await patientService.deletePatient(id);
      // Atualizar a lista removendo o paciente excluído
      const updatedPatients = patients.filter(patient => patient.id !== id);
      setPatients(updatedPatients);
      setFilteredPatients(filteredPatients.filter(patient => patient.id !== id));
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      alert('Não foi possível excluir o paciente. Tente novamente mais tarde.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Lista de Pacientes
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/patients/register')}
          >
            Novo Paciente
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nome, CPF ou telefone..."
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
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredPatients.length === 0 ? (
          <Alert severity="info">
            Nenhum paciente encontrado. {searchTerm ? 'Tente uma busca diferente.' : 'Cadastre um novo paciente.'}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={180}>Nome</TableCell>
                    <TableCell>CPF</TableCell>
                    <TableCell>Contato</TableCell>
                    <TableCell>Município</TableCell>
                    <TableCell>Autorizador</TableCell>
                    <TableCell align="center">Café</TableCell>
                    <TableCell align="center">Almoço</TableCell>
                    <TableCell align="center">Janta</TableCell>
                    <TableCell>Data de Início</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell width={180}>
                          <Tooltip title={patient.full_name || patient.name}>
                            <Typography
                              sx={{
                                width: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              {(patient.full_name || patient.name).length > 15 
                                ? (patient.full_name || patient.name).substring(0, 15) + '...' 
                                : (patient.full_name || patient.name)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{patient.cpf}</TableCell>
                        <TableCell>{patient.contact_number}</TableCell>
                        <TableCell>{patient.municipality || patient.creator_username || '-'}</TableCell>
                        <TableCell>{patient.authorizer}</TableCell>
                        <TableCell align="center">{getMealStatus(patient, 'breakfast')}</TableCell>
                        <TableCell align="center">{getMealStatus(patient, 'lunch')}</TableCell>
                        <TableCell align="center">{getMealStatus(patient, 'dinner')}</TableCell>
                        <TableCell>
                          {formatDate(patient.start_date || patient.created_at)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleViewPatient(patient.id!)}
                          >
                            <ViewIcon />
                          </IconButton>
                          
                          {canEdit && (
                            <>
                              <Tooltip title="Editar todas as informações do paciente">
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleEditPatient(patient.id!)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeletePatient(patient.id!)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredPatients.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Itens por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Diálogo para editar paciente */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Informações do Paciente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={editFormData.name || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF"
                name="cpf"
                value={editFormData.cpf || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contato"
                name="contact_number"
                value={editFormData.contact_number || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Autorizador"
                name="authorizer"
                value={editFormData.authorizer || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Município"
                name="municipality"
                value={editFormData.municipality || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Entrada"
                name="start_date"
                type="date"
                value={editFormData.start_date ? new Date(editFormData.start_date).toISOString().split('T')[0] : ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Saída Prevista"
                name="end_date"
                type="date"
                value={editFormData.end_date ? new Date(editFormData.end_date).toISOString().split('T')[0] : ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={savingPatient}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Refeições
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editFormData.breakfast || false}
                    onChange={(e) => handleFormMealChange('breakfast', e.target.checked)}
                    color="primary"
                    disabled={savingPatient}
                  />
                }
                label="Café da Manhã"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editFormData.lunch || false}
                    onChange={(e) => handleFormMealChange('lunch', e.target.checked)}
                    color="primary"
                    disabled={savingPatient}
                  />
                }
                label="Almoço"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editFormData.dinner || false}
                    onChange={(e) => handleFormMealChange('dinner', e.target.checked)}
                    color="primary"
                    disabled={savingPatient}
                  />
                }
                label="Jantar"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Observações
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observação"
                name="observation"
                value={editFormData.observation || ''}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={4}
                disabled={savingPatient}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            color="inherit"
            disabled={savingPatient}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePatient} 
            color="primary" 
            variant="contained"
            disabled={savingPatient}
          >
            {savingPatient ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientsList; 