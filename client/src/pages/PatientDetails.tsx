import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { patientService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário tem permissão para editar
  const canEdit = user?.role === UserRole.ADMIN;

  // Buscar detalhes do paciente
  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const patientData = await patientService.getPatientById(Number(id));
        setPatient(patientData);
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do paciente:', err);
        setError('Não foi possível carregar os detalhes do paciente. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  // Navegar para a página de edição do paciente
  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  // Excluir paciente (soft delete)
  const handleDeletePatient = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este paciente?')) return;

    try {
      await patientService.deletePatient(Number(id));
      navigate('/patients');
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      alert('Não foi possível excluir o paciente. Tente novamente mais tarde.');
    }
  };

  // Renderizar chip de status (sim/não)
  const renderStatusChip = (value: boolean) => (
    <Chip
      icon={value ? <CheckIcon /> : <CloseIcon />}
      label={value ? 'Sim' : 'Não'}
      color={value ? 'success' : 'error'}
    />
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/patients')}
        >
          Voltar para a lista
        </Button>
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Paciente não encontrado
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/patients')}
        >
          Voltar para a lista
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/patients')}
              sx={{ mr: 2 }}
            >
              Voltar
            </Button>
            <Typography variant="h4" component="h1">
              Detalhes do Paciente
            </Typography>
          </Box>

          {canEdit && (
            <Box>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<EditIcon />} 
                onClick={handleEditPatient}
                sx={{ mr: 1 }}
              >
                Editar
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />} 
                onClick={handleDeletePatient}
              >
                Excluir
              </Button>
            </Box>
          )}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'primary.main', 
                      borderRadius: '50%', 
                      p: 1, 
                      color: 'white',
                      mr: 2
                    }}
                  >
                    <PersonIcon fontSize="large" />
                  </Box>
                  <Typography variant="h5">
                    {patient.full_name || patient.name}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  CPF
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.cpf}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Número de Contato
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.contact_number}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Autorizador
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.authorizer}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Município
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.municipality || patient.creator_username || '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Refeições
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Café da Manhã
                  </Typography>
                  {renderStatusChip(patient.breakfast || patient.has_coffee || false)}
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Almoço
                  </Typography>
                  {renderStatusChip(patient.lunch || patient.has_lunch || false)}
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Jantar
                  </Typography>
                  {renderStatusChip(patient.dinner || false)}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
};

export default PatientDetails; 