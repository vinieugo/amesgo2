import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../../core/api-response';
import { ApiError } from '../../core/api-error';
import { cryptoService } from '../../core/crypto.service';
import { getUserByEmail, getUserByUsername, createUser, updateUser, getUserById, User, UserRole, getAllUsers } from '../../models/user.model';

/**
 * Controlador de Autenticação
 * Implementa a lógica de negócios para operações de autenticação e usuários
 */
export class AuthController {
  /**
   * Realiza o login do usuário
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, username, password } = req.body;
      
      // Validar entrada - aceita email OU username
      if ((!email && !username) || !password) {
        throw new ApiError('Email/username e senha são obrigatórios', 400, true);
      }
      
      let user: User | null = null;
      
      // Buscar usuário pelo email ou username
      if (email) {
        user = await getUserByEmail(email);
      } else if (username) {
        user = await getUserByUsername(username);
      }
      
      if (!user) {
        // Não revelar que o usuário não existe (prevenção de enumeração)
        throw new ApiError('Credenciais inválidas', 401, true);
      }
      
      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError('Credenciais inválidas', 401, true);
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '1h' }
      );
      
      // Gerar token CSRF
      const csrfToken = cryptoService.generateHmac(token);
      
      // Enviar resposta com informações do usuário (exceto senha)
      const { password: _, ...userWithoutPassword } = user;
      
      ApiResponse.success(res, {
        user: userWithoutPassword,
        token,
        csrfToken
      }, 'Login realizado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Registra um novo usuário
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, role } = req.body;
      
      // Log para depuração
      console.log('Tentativa de registro de usuário:', { username, email, role });
      console.log('Usuário atual:', req.user);
      
      // Validar entrada
      if (!username || !email || !password) {
        throw new ApiError('Username, email e senha são obrigatórios', 400, true);
      }
      
      // Verificar se o email já está em uso
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new ApiError('Email já está em uso', 409, true);
      }
      
      // Verificar se há usuários no sistema
      const allUsers = await getAllUsers();
      const isFirstUser = allUsers.length === 0;
      
      // Se não for o primeiro usuário, verificar se o usuário atual é um administrador
      if (!isFirstUser && (!req.user || req.user.role !== UserRole.ADMIN)) {
        console.log('Tentativa de criar usuário sem permissão de administrador:', req.user);
        throw new ApiError('Apenas administradores podem criar novos usuários', 403, true);
      }
      
      // Verificar se o papel é válido
      const validRoles = Object.values(UserRole);
      
      // Se for o primeiro usuário, forçar o papel para ADMIN
      // Caso contrário, usar o papel fornecido ou USER como padrão
      const userRole = isFirstUser 
        ? UserRole.ADMIN 
        : (role && validRoles.includes(role) ? role : UserRole.USER);
      
      console.log('Criando usuário com papel:', userRole);
      
      // Criptografar senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Criar novo usuário
      const userId = await createUser({
        username,
        email,
        password: hashedPassword,
        role: userRole
      });
      
      // Buscar o usuário criado
      const newUser = await getUserById(userId);
      if (!newUser) {
        throw new ApiError('Erro ao criar usuário', 500, true);
      }
      
      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = newUser;
      
      console.log('Usuário criado com sucesso:', userWithoutPassword);
      
      ApiResponse.created(res, userWithoutPassword, 'Usuário registrado com sucesso');
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Processa solicitação de recuperação de senha
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      // Validar entrada
      if (!email) {
        throw new ApiError('Email é obrigatório', 400, true);
      }
      
      // Não revelar se o email existe ou não (prevenção de enumeração)
      // Apenas registrar internamente se o email existe
      const user = await getUserByEmail(email);
      
      if (user) {
        // Gerar token seguro para reset de senha
        const resetToken = cryptoService.generateSecureToken(32);
        
        // Em produção, armazenar o token no banco de dados com expiração
        // e enviar email com link para reset
        
        // Criptografar o token para armazenamento seguro
        const encryptedToken = cryptoService.encrypt(resetToken);
        
        // Aqui seria implementado o envio de email com o token
        console.log(`Token de reset para ${email}: ${resetToken}`);
      }
      
      // Sempre retornar a mesma resposta, independente do email existir ou não
      ApiResponse.success(res, null, 'Se o email estiver registrado, você receberá instruções para redefinir sua senha');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Redefine a senha do usuário
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;
      
      // Validar entrada
      if (!token || !password) {
        throw new ApiError('Token e nova senha são obrigatórios', 400, true);
      }
      
      // Em produção, verificar se o token existe no banco de dados e não expirou
      
      // Descriptografar o token para verificação
      try {
        const decryptedToken = cryptoService.decrypt(token);
        
        // Verificar se o token é válido
        // Em produção, comparar com o token armazenado no banco de dados
        
        // Atualizar a senha do usuário
        // Aqui seria implementada a atualização da senha no banco de dados
        
        ApiResponse.success(res, null, 'Senha redefinida com sucesso');
      } catch (error) {
        throw new ApiError('Token inválido ou expirado', 400, true);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Verifica se o token JWT é válido
   */
  public verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError('Token não fornecido', 401, true);
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        // Verificar se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
        ApiResponse.success(res, { valid: true, user: decoded }, 'Token válido');
      } catch (error) {
        throw new ApiError('Token inválido ou expirado', 401, true);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Criptografa dados sensíveis
   */
  public encryptData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data } = req.body;
      
      // Validar entrada
      if (!data) {
        throw new ApiError('Dados para criptografia são obrigatórios', 400, true);
      }
      
      // Criptografar dados
      const encryptedData = cryptoService.encrypt(
        typeof data === 'object' ? JSON.stringify(data) : data
      );
      
      ApiResponse.success(res, { encryptedData }, 'Dados criptografados com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Descriptografa dados criptografados
   */
  public decryptData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { encryptedData } = req.body;
      
      // Validar entrada
      if (!encryptedData) {
        throw new ApiError('Dados criptografados são obrigatórios', 400, true);
      }
      
      // Descriptografar dados
      try {
        const decryptedData = cryptoService.decrypt(encryptedData);
        
        // Tentar converter para JSON se possível
        let parsedData;
        try {
          parsedData = JSON.parse(decryptedData);
        } catch (e) {
          parsedData = decryptedData;
        }
        
        ApiResponse.success(res, { decryptedData: parsedData }, 'Dados descriptografados com sucesso');
      } catch (error) {
        throw new ApiError('Não foi possível descriptografar os dados', 400, true);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Altera a senha do usuário autenticado
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obter ID do usuário do token JWT (definido pelo middleware de autenticação)
      const userId = (req as any).user.id;
      
      const { currentPassword, newPassword } = req.body;
      
      // Validar entrada
      if (!currentPassword || !newPassword) {
        throw new ApiError('Senha atual e nova senha são obrigatórias', 400, true);
      }
      
      // Buscar usuário atual
      const user = await getUserById(userId);
      if (!user) {
        throw new ApiError('Usuário não encontrado', 404, true);
      }
      
      // Verificar se a senha atual está correta
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ApiError('Senha atual incorreta', 401, true);
      }
      
      // Criptografar a nova senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Atualizar senha
      const updated = await updateUser(userId, {
        password: hashedPassword,
        updated_at: new Date()
      });
      
      if (!updated) {
        throw new ApiError('Erro ao atualizar senha', 500, true);
      }
      
      ApiResponse.success(res, null, 'Senha alterada com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Obtém informações do usuário atual
   */
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obter ID do usuário do token JWT (definido pelo middleware de autenticação)
      const userId = req.user?.id;
      
      if (!userId) {
        throw new ApiError('Usuário não autenticado', 401, true);
      }
      
      // Buscar usuário pelo ID
      const user = await getUserById(userId);
      if (!user) {
        throw new ApiError('Usuário não encontrado', 404, true);
      }
      
      // Remover senha da resposta
      const { password, ...userWithoutPassword } = user;
      
      ApiResponse.success(res, userWithoutPassword, 'Informações do usuário obtidas com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Atualiza informações do usuário atual
   */
  public updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obter ID do usuário do token JWT (definido pelo middleware de autenticação)
      const userId = req.user?.id;
      
      if (!userId) {
        throw new ApiError('Usuário não autenticado', 401, true);
      }
      
      // Buscar usuário pelo ID
      const user = await getUserById(userId);
      if (!user) {
        throw new ApiError('Usuário não encontrado', 404, true);
      }
      
      // Campos que podem ser atualizados
      const { email, username } = req.body;
      
      // Verificar se o email já está em uso por outro usuário
      if (email && email !== user.email) {
        const existingUser = await getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          throw new ApiError('Email já está em uso por outro usuário', 409, true);
        }
      }
      
      // Atualizar usuário
      const updated = await updateUser(userId, {
        username: username || user.username,
        email: email || user.email,
        updated_at: new Date()
      });
      
      if (!updated) {
        throw new ApiError('Erro ao atualizar usuário', 500, true);
      }
      
      // Buscar usuário atualizado
      const updatedUser = await getUserById(userId);
      if (!updatedUser) {
        throw new ApiError('Erro ao obter usuário atualizado', 500, true);
      }
      
      // Remover senha da resposta
      const { password, ...userWithoutPassword } = updatedUser;
      
      ApiResponse.success(res, userWithoutPassword, 'Usuário atualizado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Lista todos os usuários (somente para administradores)
   */
  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar se o usuário atual é admin
      if (req.user?.role !== UserRole.ADMIN) {
        throw new ApiError('Apenas administradores podem listar usuários', 403, true);
      }

      const users = await getAllUsers();
      
      // Remover senhas da resposta
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      ApiResponse.success(res, { users: usersWithoutPasswords }, 'Lista de usuários obtida com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };

  /**
   * Lista informações básicas de todos os usuários (acessível para todos os usuários autenticados)
   * Retorna apenas id, username e role para uso em interfaces que precisam exibir o nome do usuário
   */
  public getAllUsersBasic = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        console.log('Tentativa de acessar getAllUsersBasic sem autenticação');
        throw new ApiError('Usuário não autenticado', 401, true);
      }

      console.log(`Usuário ${req.user.id} (${req.user.role}) solicitou lista básica de usuários`);
      const users = await getAllUsers();
      console.log(`Obtidos ${users.length} usuários do banco de dados`);
      
      // Retornar apenas informações básicas (id, username, role)
      const basicUserInfo = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role
      }));
      
      console.log(`Retornando informações básicas de ${basicUserInfo.length} usuários`);
      ApiResponse.success(res, { users: basicUserInfo }, 'Lista básica de usuários obtida com sucesso');
    } catch (error) {
      console.error('Erro ao obter lista básica de usuários:', error);
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
}

// Exportar uma instância do controlador
export const authController = new AuthController(); 