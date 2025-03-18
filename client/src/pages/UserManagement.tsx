import React, { useState, useEffect } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { userService } from '../services/api';
import { User, UserRole } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: UserRole.REGISTER // Default to REGISTER role
  });
  const [formError, setFormError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  // Carregar lista de usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getAllUsers();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Resposta da API não é um array:', data);
          setUsers([]);
          setError('Formato de resposta inválido ao carregar usuários.');
        }
      } catch (err: any) {
        console.error('Erro ao buscar usuários:', err);
        setError('Não foi possível carregar a lista de usuários.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Manipulador de alteração de campos de texto do formulário
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manipulador de alteração do Select
  const handleRoleChange = (e: SelectChangeEvent<UserRole>) => {
    setFormData({
      ...formData,
      role: e.target.value as UserRole
    });
  };

  // Abrir diálogo para criar novo usuário
  const handleOpenDialog = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: UserRole.REGISTER // Default to REGISTER role
    });
    setFormError(null);
    setOpenDialog(true);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: UserRole.REGISTER
    });
    setFormError(null);
  };

  // Enviar formulário para criar novo usuário
  const handleSubmit = async () => {
    // Validação básica
    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      setFormError('Todos os campos são obrigatórios');
      return;
    }

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      const result = await userService.createUser(userData);
      
      // Verificar se result.user existe antes de adicioná-lo à lista
      if (result && result.user) {
        // Garantir que users seja um array antes de adicionar o novo usuário
        const currentUsers = Array.isArray(users) ? users : [];
        // Adicionar o novo usuário à lista
        setUsers([...currentUsers, result.user]);
        
        // Fechar o diálogo
        handleCloseDialog();
      } else {
        console.error('Resposta da API não contém o usuário criado:', result);
        setFormError('Erro ao criar usuário: resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setFormError(err.message || 'Erro ao criar usuário');
    }
  };

  // Retornar cor do chip com base no papel do usuário
  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'primary';
      case UserRole.CLIENT:
        return 'success';
      case UserRole.REGISTER:
        return 'info';
      default:
        return 'default';
    }
  };

  // Retornar nome traduzido do papel do usuário
  const getRoleName = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.CLIENT:
        return 'Cliente';
      case UserRole.REGISTER:
        return 'Cadastro';
      default:
        return role;
    }
  };

  const renderUsersTable = () => {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tipo de Usuário</TableCell>
              <TableCell>Data de Criação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={getRoleName(user.role)} 
                    color={getRoleColor(user.role) as any}
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gerenciamento de Usuários
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Novo Usuário
          </Button>
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
          renderUsersTable()
        )}
      </Paper>

      {/* Diálogo para criar novo usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              fullWidth
              margin="normal"
              label="Nome de Usuário"
              name="username"
              value={formData.username}
              onChange={handleTextChange}
            />
            <TextField
              fullWidth
              margin="normal"
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleTextChange}
            />
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label="Senha"
              name="password"
              value={formData.password}
              onChange={handleTextChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                label="Tipo de Usuário"
              >
                <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                <MenuItem value={UserRole.CLIENT}>Cliente</MenuItem>
                <MenuItem value={UserRole.REGISTER}>Cadastro</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Criar Usuário
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 