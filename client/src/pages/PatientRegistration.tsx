import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { PatientFormData, PatientStatus } from '../types/patient';
import { patientService } from '../services/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';
import { useAuth } from '../contexts/AuthContext';

// Componente para os toggles de sim/não para refeições
const MealToggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <Typography variant="body1">{label}:</Typography>
      </Grid>
      <Grid item xs={6} sm={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={() => onChange(true)}
              sx={{
                color: 'success.main',
                '&.Mui-checked': {
                  color: 'success.main',
                },
              }}
            />
          }
          label="Sim"
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!checked}
              onChange={() => onChange(false)}
              sx={{
                color: 'error.main',
                '&.Mui-checked': {
                  color: 'error.main',
                },
              }}
            />
          }
          label="Não"
        />
      </Grid>
    </Grid>
  );
};

const PatientRegistration: React.FC = () => {
  const { checkAndRenewToken } = useAuth();
  const navigate = useNavigate();
  // Estado inicial do formulário
  const initialState: PatientFormData = {
    name: '',
    cpf: '',
    contact_number: '',
    authorizer: '',
    breakfast: false,
    lunch: false,
    dinner: false,
    observation: '',
    municipality: '',
    status: PatientStatus.ACTIVE,
    start_date: undefined,
    end_date: undefined
  };
  
  const [formData, setFormData] = useState<PatientFormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manipuladores de alteração para campos de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manipuladores para campos de refeição
  const handleMealChange = (field: 'breakfast' | 'lunch' | 'dinner', value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Formatar CPF enquanto digita (###.###.###-##)
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (digits.length > 0) {
      formattedValue = digits.substring(0, 3);
      if (digits.length > 3) {
        formattedValue += '.' + digits.substring(3, 6);
      }
      if (digits.length > 6) {
        formattedValue += '.' + digits.substring(6, 9);
      }
      if (digits.length > 9) {
        formattedValue += '-' + digits.substring(9, 11);
      }
    }
    
    return formattedValue;
  };
  
  // Formatar número de telefone (## #####-####)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (digits.length > 0) {
      formattedValue = digits.substring(0, 2);
      if (digits.length > 2) {
        formattedValue += ' ' + digits.substring(2, 7);
      }
      if (digits.length > 7) {
        formattedValue += '-' + digits.substring(7, 11);
      }
    }
    
    return formattedValue;
  };
  
  // Manipular alteração do CPF com formatação
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formattedValue }));
  };
  
  // Manipular alteração do telefone com formatação
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, contact_number: formattedValue }));
  };
  
  // Manipulador para data inicial
  const handleStartDateChange = (date: Date | null) => {
    // Verificar se a data é válida antes de converter para ISO string
    const isValidDate = date && !isNaN(date.getTime());
    setFormData(prev => ({ 
      ...prev, 
      start_date: isValidDate ? date!.toISOString() : undefined 
    }));
  };
  
  // Manipulador para data final
  const handleEndDateChange = (date: Date | null) => {
    // Verificar se a data é válida antes de converter para ISO string
    const isValidDate = date && !isNaN(date.getTime());
    setFormData(prev => ({ 
      ...prev, 
      end_date: isValidDate ? date!.toISOString() : undefined 
    }));
  };
  
  // Verificar autenticação ao carregar o componente
  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAndRenewToken();
      if (!isValid) {
        setError('Sua sessão expirou. Por favor, faça login novamente.');
        // Redirecionar para a página de login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };
    
    verifyAuth();
  }, [checkAndRenewToken, navigate]);
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validar campos obrigatórios
    if (!formData.name || !formData.cpf || !formData.contact_number || !formData.authorizer) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      
      // Verificar e renovar o token se necessário
      const tokenValid = await checkAndRenewToken();
      if (!tokenValid) {
        setError('Sua sessão expirou. Por favor, faça login novamente.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }
      
      // Garantir que o status seja ACTIVE
      const patientData = {
        ...formData,
        status: PatientStatus.ACTIVE // Usar o enum PatientStatus.ACTIVE
      };
      
      console.log('Enviando dados do paciente para cadastro:', patientData);
      
      const result = await patientService.createPatient(patientData);
      
      console.log('Paciente cadastrado com sucesso:', result);
      
      setSuccess(true);
      setFormData(initialState); // Limpar formulário após sucesso
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      
      // Log detalhado do erro
      if (err.response) {
        console.error('Detalhes do erro:', {
          status: err.response.status,
          data: err.response.data
        });
      }
      
      // Verificar se é um erro de autenticação
      if (err.message && (
        err.message.includes('sessão expirou') || 
        err.message.includes('autenticado') || 
        err.message.includes('permissão')
      )) {
        setError(err.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(err.message || 'Erro ao cadastrar paciente');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Cadastro de Paciente
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                required
                variant="outlined"
                placeholder="000.000.000-00"
                inputProps={{ maxLength: 14 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Contato"
                name="contact_number"
                value={formData.contact_number}
                onChange={handlePhoneChange}
                required
                variant="outlined"
                placeholder="00 00000-0000"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autorizador"
                name="authorizer"
                value={formData.authorizer}
                onChange={handleTextChange}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Período de Hospedagem
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Inicial"
                  value={formData.start_date ? new Date(formData.start_date) : null}
                  onChange={handleStartDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      variant: "outlined",
                      helperText: "Data de início da hospedagem"
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Final Prevista"
                  value={formData.end_date ? new Date(formData.end_date) : null}
                  onChange={handleEndDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      variant: "outlined",
                      helperText: "Data prevista para o fim da hospedagem"
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="observation"
                value={formData.observation || ''}
                onChange={handleTextChange}
                variant="outlined"
                multiline
                rows={4}
                placeholder="Adicione informações importantes sobre o paciente"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ mb: 2, backgroundColor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Refeições
                  </Typography>
                  
                  <MealToggle 
                    label="Café da manhã" 
                    checked={formData.breakfast} 
                    onChange={(value) => handleMealChange('breakfast', value)} 
                  />
                  
                  <MealToggle 
                    label="Almoço" 
                    checked={formData.lunch} 
                    onChange={(value) => handleMealChange('lunch', value)} 
                  />
                  
                  <MealToggle 
                    label="Janta" 
                    checked={formData.dinner} 
                    onChange={(value) => handleMealChange('dinner', value)} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Cadastrar Paciente'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Paciente cadastrado com sucesso!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PatientRegistration; 