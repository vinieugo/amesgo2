import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress, 
  Alert,
  Divider,
  Button,
  Snackbar
} from '@mui/material';
import { patientService } from '../services/api';
import { Patient, PatientStatus } from '../types/patient';
import { useAuth } from '../contexts/AuthContext';
// @ts-ignore
import PatientCard from '../components/PatientCard';

const PatientTracking: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { user } = useAuth();

  const refreshData = () => {
    setRefreshKey(oldKey => oldKey + 1);
    setSnackbarMessage('Atualizando lista de pacientes...');
    setSnackbarOpen(true);
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando pacientes ativos para o módulo de acompanhamento...');
        
        let data = await patientService.getAllPatients();
        console.log('Pacientes recebidos do servidor:', data);
        
        if (!data || data.length === 0) {
          console.log('Nenhum paciente retornado do servidor');
          setPatients([]);
          return;
        }
        
        // Verificar se há pacientes sem ID
        const invalidPatients = data.filter(patient => !patient || !patient.id);
        if (invalidPatients.length > 0) {
          console.error('Pacientes sem ID válido:', invalidPatients);
          // Remover pacientes sem ID da lista
          const validPatients = data.filter(patient => patient && patient.id);
          console.log(`Removidos ${invalidPatients.length} pacientes inválidos da lista`);
          
          // Se não houver pacientes válidos, exibir mensagem de erro
          if (validPatients.length === 0) {
            setError('Não foi possível carregar os pacientes ativos. Dados inválidos recebidos do servidor.');
            setPatients([]);
            return;
          }
          
          // Continuar com os pacientes válidos
          data = validPatients;
        }
        
        // Verificar se há pacientes com status indefinido
        const undefinedStatusPatients = data.filter(patient => patient.status === undefined);
        if (undefinedStatusPatients.length > 0) {
          console.warn('Pacientes com status indefinido:', undefinedStatusPatients);
        }
        
        // Filtrar apenas pacientes ativos
        const activePatients = data.filter(patient => 
          patient.status === PatientStatus.ACTIVE || patient.status === undefined
        );
        
        console.log('Pacientes ativos filtrados:', activePatients);
        console.log('Total de pacientes ativos:', activePatients.length);
        
        // Verificar se há pacientes com status ACTIVE mas que não foram incluídos
        const missingActivePatients = data.filter(
          patient => patient.status === PatientStatus.ACTIVE && 
          !activePatients.some(p => p.id === patient.id)
        );
        
        if (missingActivePatients.length > 0) {
          console.error('Pacientes ativos que não foram incluídos:', missingActivePatients);
        }
        
        setPatients(activePatients);
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
        
        setError('Não foi possível carregar os pacientes ativos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [refreshKey]);

  // Manipulador para quando o status de um paciente muda
  const handlePatientStatusChange = (updatedPatient: Patient) => {
    console.log('Atualizando paciente:', updatedPatient);
    
    // Verificar se o paciente atualizado tem um ID válido
    if (!updatedPatient || !updatedPatient.id) {
      console.error('Erro: Tentativa de atualizar um paciente sem ID válido', updatedPatient);
      return;
    }
    
    setPatients(prevPatients => {
      // Verificar se há pacientes sem ID na lista
      const invalidPatients = prevPatients.filter(p => !p || !p.id);
      if (invalidPatients.length > 0) {
        console.error('Erro: Pacientes sem ID na lista atual:', invalidPatients);
      }
      
      return prevPatients
        .filter(p => p && p.id) // Garantir que só processamos pacientes com ID válido
        .map(p => p.id === updatedPatient.id ? updatedPatient : p)
        .filter(p => p.status !== PatientStatus.INACTIVE); // Remove pacientes inativos da lista
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            Pacientes em Atendimento
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={refreshData}
          >
            Atualizar Lista
          </Button>
        </Box>
        <Divider sx={{ mt: 2, mb: 4 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {patients.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Não há pacientes ativos no momento.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {patients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={patient.id}>
                <PatientCard 
                  patient={patient} 
                  userRole={user?.role}
                  onStatusChange={handlePatientStatusChange}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default PatientTracking; 