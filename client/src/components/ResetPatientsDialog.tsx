import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { patientService } from '../services/api';

interface ResetPatientsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ResetPatientsDialog: React.FC<ResetPatientsDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(event.target.value);
  };

  const isConfirmValid = confirmText === 'RESETAR TODOS';

  const handleReset = async () => {
    if (!isConfirmValid) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await patientService.resetAllPatients();
      
      console.log('Reset de pacientes concluído:', result);
      
      // Limpar o campo de confirmação
      setConfirmText('');
      
      // Chamar o callback de sucesso
      onSuccess();
      
      // Fechar o diálogo
      onClose();
    } catch (err: any) {
      console.error('Erro ao resetar pacientes:', err);
      setError(err.message || 'Ocorreu um erro ao resetar os pacientes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
        Atenção: Operação Irreversível
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <DialogContentText color="error" sx={{ fontWeight: 'bold', mb: 2 }}>
            Esta operação irá excluir permanentemente TODOS os pacientes do sistema!
          </DialogContentText>
          
          <DialogContentText sx={{ mb: 2 }}>
            Todos os dados de pacientes serão removidos, incluindo pacientes ativos e inativos.
            Esta ação não pode ser desfeita.
          </DialogContentText>
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Para confirmar, digite "RESETAR TODOS" no campo abaixo:
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={confirmText}
            onChange={handleConfirmChange}
            placeholder="RESETAR TODOS"
            disabled={loading}
            error={confirmText.length > 0 && !isConfirmValid}
            helperText={confirmText.length > 0 && !isConfirmValid ? 'Texto de confirmação incorreto' : ''}
            sx={{ mb: 2 }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleReset}
          disabled={!isConfirmValid || loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Processando...' : 'Confirmar Reset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetPatientsDialog; 