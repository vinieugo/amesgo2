import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
  Paper,
  styled,
  Tooltip,
  DialogContentText,
  Avatar,
  TextField,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Restaurant as LunchIcon,
  FreeBreakfast as BreakfastIcon,
  DinnerDining as DinnerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExitToApp as ExitIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { Patient, PatientStatus } from '../types/patient';
import { UserRole } from '../types/auth';
import { patientService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import AccessibleDialog from './AccessibleDialog';

interface PatientCardProps {
  patient: Patient;
  userRole?: UserRole;
  onStatusChange: (patient: Patient) => void;
}

// Componente estilizado para o avatar do paciente
const PatientAvatar = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  fontSize: '1.2rem',
  marginRight: theme.spacing(2),
}));

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
    <Tooltip title={`${active ? 'Recebe' : 'Não recebe'} ${
      type === 'breakfast' ? 'café da manhã' : type === 'lunch' ? 'almoço' : 'jantar'
    }`}>
      <Box sx={{ display: 'flex', alignItems: 'center', mx: 0.5 }}>
        {getIcon()}
      </Box>
    </Tooltip>
  );
};

const PatientCard: React.FC<PatientCardProps> = ({ patient, userRole, onStatusChange }) => {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [municipalityDialogOpen, setMunicipalityDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [comment, setComment] = useState(patient.observation || '');
  const [municipality, setMunicipality] = useState(patient.municipality || patient.creator_username || '');
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Log para depuração
  React.useEffect(() => {
    console.log(`PatientCard - Paciente: ${patient.name}, created_by: ${patient.created_by}, creator_username: ${patient.creator_username}`);
  }, [patient]);

  // Atualizar o estado do formulário quando o paciente mudar
  React.useEffect(() => {
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
    // Atualizar também o estado do município
    setMunicipality(patient.municipality || patient.creator_username || '');
  }, [patient]);

  const handleEditClick = () => {
    if (userRole === UserRole.ADMIN || userRole === UserRole.CLIENT) {
      // Abrir o diálogo de edição para administradores e clientes
      setEditDialogOpen(true);
    } else {
      // Navegar para a página de detalhes para outros usuários
      navigate(`/patients/${patient.id}`);
    }
  };

  const handleDischargeClick = () => {
    setDischargeDialogOpen(true);
  };

  const handleDischargeConfirm = async () => {
    try {
      setLoading(true);
      console.log('Iniciando processo de baixa para o paciente:', patient.id);
      
      // Atualizar o status do paciente para INACTIVE
      const updateData = {
        status: PatientStatus.INACTIVE
      };
      
      console.log('Dados do paciente a serem atualizados:', {
        id: patient.id,
        status: PatientStatus.INACTIVE,
        statusAnterior: patient.status
      });
      
      // Usar updatePatient para atualizar o status do paciente
      const result = await patientService.updatePatient(patient.id as number, updateData);
      
      console.log('Paciente recebeu baixa com sucesso. Resposta da API:', result);
      
      // Verificar se o paciente atualizado tem um ID válido
      if (!result || !result.id) {
        console.error('Erro: API retornou um paciente sem ID válido', result);
        // Usar o paciente original com o status atualizado como fallback
        const fallbackPatient = {
          ...patient,
          status: PatientStatus.INACTIVE,
          updated_at: new Date().toISOString(),
          id: patient.id // Garantir que o ID está presente
        };
        console.log('Usando fallback para o paciente:', fallbackPatient);
        onStatusChange(fallbackPatient);
      } else {
        // Atualizar o estado local com o paciente retornado pela API
        onStatusChange(result);
      }
      
      setDischargeDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao dar baixa no paciente:', error);
      
      // Log detalhado do erro
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Erro na requisição (sem resposta):', error.request);
      } else {
        console.error('Erro ao configurar requisição:', error.message);
      }
      
      alert('Erro ao dar baixa no paciente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = () => {
    setCommentDialogOpen(true);
  };

  const handleCommentSave = async () => {
    try {
      setLoading(true);
      console.log('Iniciando salvamento de observação para o paciente:', patient.id);
      console.log('Conteúdo da observação:', comment);
      
      // Garantir que o comentário não seja undefined
      const safeComment = comment === undefined ? '' : comment;
      
      // Atualiza apenas a observação do paciente (não a observação inicial)
      const minimalUpdate = {
        observation: safeComment
      };
      
      // Atualizar o paciente com a nova observação
      const updatedPatient = await patientService.updatePatient(patient.id as number, minimalUpdate);
      
      // Verificar se o paciente atualizado tem um ID válido
      if (!updatedPatient || !updatedPatient.id) {
        console.error('Erro: API retornou um paciente sem ID válido', updatedPatient);
        // Usar o paciente original com a observação atualizada como fallback
        const fallbackPatient = {
          ...patient,
          observation: safeComment,
          id: patient.id // Garantir que o ID está presente
        };
        console.log('Usando fallback para o paciente:', fallbackPatient);
        onStatusChange(fallbackPatient);
      } else {
        // Atualizar o estado local com o paciente retornado pela API
        onStatusChange(updatedPatient);
      }
      
      console.log('Observação salva com sucesso');
      setCommentDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      alert('Erro ao salvar observação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar o município
  const handleMunicipalitySave = async () => {
    try {
      setLoading(true);
      
      // Atualizar o paciente com o novo município
      const updatedPatient = await patientService.updatePatient(patient.id!, {
        municipality
      });
      
      // Fechar o diálogo
      setMunicipalityDialogOpen(false);
      
      // Verificar se o paciente atualizado tem um ID válido
      if (!updatedPatient || !updatedPatient.id) {
        console.error('Erro: API retornou um paciente sem ID válido', updatedPatient);
        // Usar o paciente original com o município atualizado como fallback
        const fallbackPatient = {
          ...patient,
          municipality,
          id: patient.id // Garantir que o ID está presente
        };
        console.log('Usando fallback para o paciente:', fallbackPatient);
        onStatusChange(fallbackPatient);
      } else {
        // Atualizar o estado local com o paciente retornado pela API
        onStatusChange(updatedPatient);
      }
      
      // Exibir mensagem de sucesso
      console.log('Município atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar município:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar o status de refeição
  const handleMealStatusChange = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    try {
      setLoading(true);
      // Inverte o status da refeição selecionada
      const updatedMealStatus = !patient[mealType];
      const updateData = { [mealType]: updatedMealStatus };
      
      // Atualizar o paciente com o novo status de refeição
      const updatedPatient = await patientService.updatePatient(patient.id as number, updateData);
      
      // Verificar se o paciente atualizado tem um ID válido
      if (!updatedPatient || !updatedPatient.id) {
        console.error('Erro: API retornou um paciente sem ID válido', updatedPatient);
        // Usar o paciente original com o status de refeição atualizado como fallback
        const fallbackPatient = {
          ...patient,
          [mealType]: updatedMealStatus,
          id: patient.id // Garantir que o ID está presente
        };
        console.log('Usando fallback para o paciente:', fallbackPatient);
        onStatusChange(fallbackPatient);
      } else {
        // Atualizar o estado local com o paciente retornado pela API
        onStatusChange(updatedPatient);
      }
    } catch (error) {
      console.error(`Erro ao atualizar status de ${mealType}:`, error);
      alert(`Erro ao atualizar status de refeição. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  // Iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    try {
      setLoading(true);
      
      // Criar objeto com apenas os campos que foram alterados
      const changedFields: Partial<Patient> = {};
      
      // Comparar cada campo para ver se foi alterado
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== (patient as any)[key]) {
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
      const updatedPatient = await patientService.updatePatient(patient.id!, changedFields);
      
      // Verificar se o paciente atualizado tem um ID válido
      if (!updatedPatient || !updatedPatient.id) {
        console.error('Erro: API retornou um paciente sem ID válido', updatedPatient);
        // Usar o paciente original com os campos atualizados como fallback
        const fallbackPatient = {
          ...patient,
          ...changedFields,
          id: patient.id // Garantir que o ID está presente
        };
        console.log('Usando fallback para o paciente:', fallbackPatient);
        onStatusChange(fallbackPatient);
      } else {
        // Atualizar o estado local com o paciente retornado pela API
        onStatusChange(updatedPatient);
      }
      
      // Fechar o diálogo
      setEditDialogOpen(false);
      
      // Exibir mensagem de sucesso
      console.log('Paciente atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          m: 1,
          borderRadius: 1,
          overflow: 'auto',
          border: 'none',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 8,
          },
          elevation: 3
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Cabeçalho com nome e botão de tela cheia */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Tooltip title={patient.name}>
              <Typography variant="h6" component="div" sx={{ 
                fontWeight: 'bold', 
                mr: 1,
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {patient.name.length > 15 
                  ? patient.name.substring(0, 15) + '...' 
                  : patient.name}
              </Typography>
            </Tooltip>
            <Tooltip title="Ver detalhes do paciente">
              <IconButton 
                size="small" 
                onClick={() => {
                  setDetailsDialogOpen(true);
                }}
                aria-label="Ver detalhes do paciente"
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Avatar e CPF */}
          <Box display="flex" alignItems="center" mb={1.5}>
            <PatientAvatar>
              {getInitials(patient.name)}
            </PatientAvatar>
            <Typography variant="body2" color="text.secondary">
              CPF: {formatCPF(patient.cpf)}
            </Typography>
          </Box>
          
          {/* Linha de contato */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="body2" color="text.secondary">
              Contato:
            </Typography>
            <Typography variant="body2">
              {patient.contact_number}
            </Typography>
          </Box>

          {/* Linha de refeições */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="body2" color="text.secondary">
              Refeições:
            </Typography>
            <Box display="flex">
              {(userRole === UserRole.ADMIN || userRole === UserRole.CLIENT) ? (
                <>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMealStatusChange('breakfast')}
                    disabled={loading}
                  >
                    <MealStatusIcon active={patient.breakfast} type="breakfast" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMealStatusChange('lunch')}
                    disabled={loading}
                  >
                    <MealStatusIcon active={patient.lunch} type="lunch" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMealStatusChange('dinner')}
                    disabled={loading}
                  >
                    <MealStatusIcon active={patient.dinner} type="dinner" />
                  </IconButton>
                </>
              ) : (
                <>
                  <MealStatusIcon active={patient.breakfast} type="breakfast" />
                  <MealStatusIcon active={patient.lunch} type="lunch" />
                  <MealStatusIcon active={patient.dinner} type="dinner" />
                </>
              )}
            </Box>
          </Box>

          {/* Município (usando creator_username se disponível) */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="body2" color="text.secondary">
              Município:
            </Typography>
            <Typography variant="body2">
              {patient.municipality || patient.creator_username || '-'}
            </Typography>
          </Box>
        </CardContent>

        <CardActions disableSpacing sx={{ justifyContent: 'flex-end', px: 2, pt: 0, pb: 1 }}>
          {/* Botões específicos com base no papel do usuário */}
          {(userRole === UserRole.ADMIN || userRole === UserRole.CLIENT) && (
            <>
              <IconButton 
                size="small" 
                color="info" 
                onClick={handleCommentClick}
                aria-label="Adicionar observação"
              >
                <CommentIcon />
              </IconButton>
              <Tooltip title="Editar todas as informações do paciente">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleEditClick}
                  aria-label="Editar informações do paciente"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {userRole === UserRole.ADMIN && (
            <IconButton 
              size="small" 
              color="error" 
              onClick={handleDischargeClick}
              aria-label="Dar baixa"
            >
              <ExitIcon />
            </IconButton>
          )}
        </CardActions>
      </Card>

      {/* Diálogo com detalhes do paciente */}
      <AccessibleDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        title={
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                mr: 2,
                width: 40,
                height: 40
              }}
            >
              {getInitials(patient.name)}
            </Avatar>
            <Typography variant="h6">{patient.name}</Typography>
          </Box>
        }
        actions={
          <>
            {(userRole === UserRole.ADMIN || userRole === UserRole.CLIENT) && (
              <>
                <Button 
                  onClick={handleCommentClick}
                  variant="outlined"
                  startIcon={<CommentIcon />}
                >
                  {patient.observation ? 'Editar Observação Adicional' : 'Adicionar Observação Adicional'}
                </Button>
                <Button 
                  onClick={handleEditClick}
                  variant="outlined"
                  startIcon={<EditIcon />}
                >
                  Editar Informações
                </Button>
              </>
            )}
            <Button 
              onClick={() => setDetailsDialogOpen(false)} 
              color="primary"
              variant="contained"
            >
              Fechar
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Informações Pessoais
            </Typography>
            <Divider sx={{ mb: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              CPF:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              {formatCPF(patient.cpf)}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Contato:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              {patient.contact_number}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Autorizador:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              {patient.authorizer}
            </Typography>
          </Grid>

          {patient.municipality || patient.creator_username ? (
            <>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Município:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {patient.municipality || patient.creator_username}
                </Typography>
              </Grid>
            </>
          ) : null}

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Data de entrada:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              {formatDate(patient.start_date || patient.created_at)}
            </Typography>
          </Grid>

          {/* Data de saída prevista */}
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Data de saída prevista:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              {formatDate(patient.end_date)}
            </Typography>
          </Grid>

          {/* Observações, se existirem */}
          {(patient.initial_observation || patient.observation) && (
            <>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Observações
                </Typography>
                <Divider sx={{ mb: 1 }} />
              </Grid>
              
              {patient.initial_observation && (
                <Grid item xs={12} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Observação inicial (cadastro):
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {patient.initial_observation}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {patient.observation && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Observação adicional:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {patient.observation}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </>
          )}

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Refeições
            </Typography>
            <Divider sx={{ mb: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center">
                <BreakfastIcon sx={{ mr: 1 }} color={patient.breakfast ? "success" : "error"} />
                <Typography variant="body2">Café da manhã</Typography>
              </Box>
              <Chip 
                size="small"
                icon={patient.breakfast ? <CheckCircleIcon /> : <CancelIcon />}
                label={patient.breakfast ? 'Sim' : 'Não'}
                color={patient.breakfast ? 'success' : 'error'}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center">
                <LunchIcon sx={{ mr: 1 }} color={patient.lunch ? "success" : "error"} />
                <Typography variant="body2">Almoço</Typography>
              </Box>
              <Chip 
                size="small"
                icon={patient.lunch ? <CheckCircleIcon /> : <CancelIcon />}
                label={patient.lunch ? 'Sim' : 'Não'}
                color={patient.lunch ? 'success' : 'error'}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                <DinnerIcon sx={{ mr: 1 }} color={patient.dinner ? "success" : "error"} />
                <Typography variant="body2">Jantar</Typography>
              </Box>
              <Chip 
                size="small"
                icon={patient.dinner ? <CheckCircleIcon /> : <CancelIcon />}
                label={patient.dinner ? 'Sim' : 'Não'}
                color={patient.dinner ? 'success' : 'error'}
              />
            </Box>
          </Grid>
        </Grid>
      </AccessibleDialog>

      {/* Diálogo de confirmação de baixa */}
      <AccessibleDialog
        open={dischargeDialogOpen}
        onClose={() => setDischargeDialogOpen(false)}
        title="Confirmar Baixa do Paciente"
        actions={
          <>
            <Button 
              onClick={() => setDischargeDialogOpen(false)} 
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDischargeConfirm} 
              variant="contained" 
              color="error" 
              disabled={loading}
              autoFocus
            >
              Confirmar Baixa
            </Button>
          </>
        }
      >
        <DialogContentText>
          Tem certeza que deseja dar baixa para o paciente <strong>{patient.name}</strong>? 
          Esta ação indicará que o paciente não está mais hospedado na casa de apoio.
        </DialogContentText>
      </AccessibleDialog>

      {/* Diálogo para adicionar/editar observação */}
      <AccessibleDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        title={patient.observation ? 'Editar Observação Adicional' : 'Adicionar Observação Adicional'}
        actions={
          <>
            <Button 
              onClick={() => setCommentDialogOpen(false)} 
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCommentSave} 
              variant="contained" 
              color="primary" 
              disabled={loading}
            >
              Salvar
            </Button>
          </>
        }
      >
        <DialogContentText sx={{ mb: 2 }}>
          Adicione informações importantes sobre o paciente que precisam ser registradas após o cadastro inicial.
          Estas observações serão salvas no histórico do paciente como observações adicionais.
        </DialogContentText>
        <TextField
          autoFocus
          multiline
          rows={4}
          fullWidth
          label="Observação Adicional"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          variant="outlined"
        />
      </AccessibleDialog>

      {/* Diálogo para editar município */}
      <AccessibleDialog
        open={municipalityDialogOpen}
        onClose={() => setMunicipalityDialogOpen(false)}
        title="Editar Município"
        actions={
          <>
            <Button 
              onClick={() => setMunicipalityDialogOpen(false)} 
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleMunicipalitySave} 
              color="primary" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </>
        }
      >
        <TextField
          fullWidth
          label="Município"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          variant="outlined"
          margin="normal"
          disabled={loading}
        />
      </AccessibleDialog>

      {/* Diálogo para editar paciente */}
      <AccessibleDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Editar Informações do Paciente"
        maxWidth="md"
        fullWidth
        actions={
          <>
            <Button 
              onClick={() => setEditDialogOpen(false)} 
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePatient} 
              color="primary" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome"
              name="name"
              value={editFormData.name}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CPF"
              name="cpf"
              value={editFormData.cpf}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contato"
              name="contact_number"
              value={editFormData.contact_number}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Autorizador"
              name="authorizer"
              value={editFormData.authorizer}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Município"
              name="municipality"
              value={editFormData.municipality}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
                  checked={editFormData.breakfast}
                  onChange={(e) => handleFormMealChange('breakfast', e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Café da Manhã"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editFormData.lunch}
                  onChange={(e) => handleFormMealChange('lunch', e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Almoço"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editFormData.dinner}
                  onChange={(e) => handleFormMealChange('dinner', e.target.checked)}
                  color="primary"
                  disabled={loading}
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
              value={editFormData.observation}
              onChange={handleFormChange}
              variant="outlined"
              margin="normal"
              multiline
              rows={4}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </AccessibleDialog>
    </>
  );
};

export default PatientCard; 